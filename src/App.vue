<template>
  <div class="app" :class="{ dark: isDark }">
    <!-- Welcome Screen -->
    <div v-if="!data" class="welcome-container">
      <div class="welcome-icon">
        <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <!-- iPhone body - dark gray -->
          <rect x="20" y="8" width="40" height="64" rx="8" stroke="#1C1C1E" stroke-width="2" fill="none"/>
          <!-- iPhone screen - lighter gray -->
          <rect x="22" y="12" width="36" height="56" rx="4" fill="#2C2C2E"/>
          <!-- Screen content area - blue tint -->
          <rect x="24" y="16" width="32" height="48" rx="2" fill="#007AFF" opacity="0.1"/>
          <!-- Notch -->
          <rect x="30" y="12" width="20" height="4" rx="2" fill="#1C1C1E"/>
          <!-- Home indicator -->
          <rect x="32" y="62" width="16" height="2" rx="1" fill="#48484A"/>
          <!-- Screen content lines representing analytics -->
          <rect x="28" y="22" width="24" height="3" rx="1.5" fill="#007AFF"/>
          <rect x="28" y="28" width="20" height="3" rx="1.5" fill="#5856D6" opacity="0.7"/>
          <rect x="28" y="34" width="22" height="3" rx="1.5" fill="#34C759" opacity="0.7"/>
          <rect x="28" y="40" width="18" height="3" rx="1.5" fill="#FF9500" opacity="0.7"/>
          <rect x="28" y="46" width="24" height="3" rx="1.5" fill="#FF3B30" opacity="0.5"/>
          <rect x="28" y="52" width="16" height="3" rx="1.5" fill="#AF52DE" opacity="0.5"/>
          <!-- Side buttons -->
          <rect x="18" y="20" width="2" height="6" rx="1" fill="#48484A"/>
          <rect x="18" y="30" width="2" height="10" rx="1" fill="#48484A"/>
          <rect x="60" y="22" width="2" height="8" rx="1" fill="#48484A"/>
        </svg>
      </div>
      <div class="welcome-title">Analytics Viewer</div>
      <div class="welcome-subtitle">
        Open or share an iPhone Analytics file to view a detailed summary
      </div>
      <div
        class="drop-zone"
        :class="{ 'drag-over': isDragOver }"
        @click="openFilePicker"
        @dragover.prevent="isDragOver = true"
        @dragleave="isDragOver = false"
        @drop.prevent="handleDrop"
      >
        <div class="drop-zone-icon">📁</div>
        <div class="drop-zone-text">Tap to Open File</div>
        <div class="drop-zone-hint">or drag &amp; drop an .ips file here</div>
      </div>
      <div style="margin-top: 20px; font-size: 13px; color: var(--text-tertiary);">
        You can also share files from Files or other apps
      </div>
      <input
        ref="fileInput"
        type="file"
        accept=".ips,.ips.ca.synced,.json"
        style="display: none"
        @change="handleFileInput"
      />
    </div>

    <!-- Main Dashboard -->
    <div v-else class="content-with-tabs">
      <!-- Category Detail View -->
      <template v-if="selectedCategory">
        <div class="nav-header">
          <div class="nav-back" @click="selectedCategory = null">‹</div>
          <div class="nav-title">{{ selectedCategory.icon }} {{ selectedCategory.name }}</div>
        </div>
        <div style="padding: 16px 24px; font-size: 14px; color: var(--text-tertiary);">
          {{ selectedCategory.description }}
        </div>

        <!-- Category Overview Graph -->
        <div class="section-title">Category Overview</div>
        <div class="ios-card fade-in">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 16px; background: var(--bg-card-secondary); border-radius: 10px;">
              <div :style="{ fontSize: '24px', fontWeight: '700', color: selectedCategory?.color || '#007AFF' }">{{ selectedCategory?.eventCount?.toLocaleString() || 0 }}</div>
              <div style="font-size: 11px; color: var(--text-tertiary);">Total Events</div>
            </div>
            <div style="text-align: center; padding: 16px; background: var(--bg-card-secondary); border-radius: 10px;">
              <div :style="{ fontSize: '24px', fontWeight: '700', color: selectedCategory?.color || '#007AFF' }">{{ selectedCategory?.uniqueTypes || 0 }}</div>
              <div style="font-size: 11px; color: var(--text-tertiary);">Event Types</div>
            </div>
          </div>
          <!-- Category Distribution Bar -->
          <div style="margin-top: 12px;">
            <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">Share of Total Analytics</div>
            <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--bg-card-secondary);">
              <div :style="{ width: ((selectedCategory?.eventCount || 0) / (data?.totalEvents || 1) * 100) + '%', background: selectedCategory?.color || '#007AFF' }"></div>
              <div :style="{ width: Math.max(0, 100 - ((selectedCategory?.eventCount || 0) / (data?.totalEvents || 1) * 100)) + '%', background: 'var(--separator)' }"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px;">
              <span :style="{ color: selectedCategory?.color || '#007AFF' }">{{ selectedCategory?.name }}</span>
              <span style="color: var(--text-tertiary);">{{ Math.round(((selectedCategory?.eventCount || 0) / (data?.totalEvents || 1)) * 100) }}%</span>
            </div>
          </div>
        </div>

        <!-- Category Events Bar Chart -->
        <div class="section-title">Top Events in Category</div>
        <div class="ios-card fade-in">
          <div v-for="item in categoryTopEvents" :key="item.eventName" style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span style="font-size: 12px; font-family: monospace; max-width: 70%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ getEventDisplayName(item.eventName) }}</span>
              <span style="font-size: 12px; color: var(--text-tertiary);">{{ item.count }} entries</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <div style="flex: 1; height: 6px; background: var(--bg-card-secondary); border-radius: 3px; overflow: hidden;">
                <div :style="{ width: item.percentage + '%', background: selectedCategory?.color || '#007AFF' }"></div>
              </div>
              <span style="font-size: 11px; color: var(--text-tertiary); min-width: 35px; text-align: right;">{{ item.percentage }}%</span>
            </div>
          </div>
        </div>

        <!-- Category-specific detail views with enhanced graphs -->
        <template v-if="selectedCategory.name === 'Memory (Jetsam)'">
          <div class="section-title">Top Killed Processes (with kill rate)</div>
          <div class="ios-card">
            <div
              v-for="(proc, i) in data.summary.jetsamTopProcesses.slice(0, 15)"
              :key="i"
              class="process-item"
            >
              <div
                class="process-rank"
                :style="{ background: i < 3 ? '#FF3B30' : 'var(--bg-card-secondary)', color: i < 3 ? '#fff' : 'var(--text-tertiary)' }"
              >
                {{ i + 1 }}
              </div>
              <div class="process-name">{{ proc.name }}</div>
              <div style="flex: 1; margin: 0 12px; height: 4px; background: var(--bg-card-secondary); border-radius: 2px; overflow: hidden;">
                <div :style="{ width: (proc.count / data.summary.jetsamTopProcesses[0].count * 100) + '%', background: '#FF9500' }"></div>
              </div>
              <div class="process-count">×{{ proc.count }}</div>
            </div>
          </div>
          <div class="section-title">Kill Reasons Distribution</div>
          <div class="ios-card">
            <!-- Kill Reasons Visualization -->
            <div v-if="Object.keys(data.summary.jetsamReasons).length > 0" style="margin-bottom: 16px;">
              <div style="display: flex; gap: 4px; height: 8px; border-radius: 4px; overflow: hidden; background: var(--bg-card-secondary); margin-bottom: 12px;">
                <div v-for="(count, reason, idx) in data.summary.jetsamReasons" :key="reason" :style="{ width: (count / jetsamTotalKills * 100) + '%', background: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5856D6'][idx % 6] }"></div>
              </div>
              <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
                <div v-for="(count, reason, idx) in data.summary.jetsamReasons" :key="reason" style="display: flex; align-items: center; gap: 4px; font-size: 10px;">
                  <div :style="{ width: 8, height: 8, borderRadius: 2, background: ['#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#5AC8FA', '#5856D6'][idx % 6] }"></div>
                  <span>{{ reason }}</span>
                </div>
              </div>
            </div>
            <div v-for="(count, reason) in data.summary.jetsamReasons" :key="reason" class="ios-card-row">
              <span class="label">{{ reason }}</span>
              <span class="value">{{ count }} kills</span>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Device & Power'">
          <div class="section-title">Power States Analysis</div>
          <div class="ios-card">
            <div v-for="(state, i) in data.summary.batteryStates" :key="i" class="ios-card-row" style="flex-direction: column; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="label">{{ state.state }}</span>
                <span class="value">{{ state.count }} samples · {{ formatDuration(state.duration) }}</span>
              </div>
              <!-- Energy visualization -->
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 10px; color: var(--text-tertiary); width: 40px;">Energy</span>
                <div style="flex: 1; height: 8px; background: var(--bg-card-secondary); border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: Math.min(100, Math.abs(state.energy) / 20 * 100) + '%', background: state.energy >= 0 ? '#34C759' : '#FF3B30' }"></div>
                </div>
                <span style="font-size: 11px; color: var(--text-tertiary); min-width: 45px; text-align: right;">{{ state.energy >= 0 ? '+' : '' }}{{ state.energy.toFixed(1) }}Wh</span>
              </div>
              <!-- Duration visualization -->
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 10px; color: var(--text-tertiary); width: 40px;">Duration</span>
                <div style="flex: 1; height: 8px; background: var(--bg-card-secondary); border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: (state.duration / getMaxDuration() * 100) + '%', background: '#5AC8FA' }"></div>
                </div>
                <span style="font-size: 11px; color: var(--text-tertiary); min-width: 45px; text-align: right;">{{ formatDuration(state.duration) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Notifications'">
          <div class="section-title">Notification Distribution</div>
          <div class="ios-card">
            <!-- Notification Pie Chart -->
            <div v-if="data?.summary?.totalNotifications > 0" style="display: flex; justify-content: center; margin-bottom: 16px;">
              <div :style="{ position: 'relative', width: '80px', height: '80px', borderRadius: '50%', background: 'conic-gradient(#FF3B30 0deg ' + urgentDegrees + 'deg, #8E8E93 ' + urgentDegrees + 'deg 360deg)' }">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px; background: var(--bg-card); border-radius: 50%;"></div>
              </div>
            </div>
            <div style="display: flex; justify-content: center; gap: 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: #FF3B30;"></div>
                <span style="font-size: 12px;">Urgent ({{ Math.round(data.summary.urgentNotifications / data.summary.totalNotifications * 100) }}%)</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px;">
                <div style="width: 10px; height: 10px; border-radius: 2px; background: #8E8E93;"></div>
                <span style="font-size: 12px;">Non-urgent ({{ Math.round(data.summary.nonUrgentNotifications / data.summary.totalNotifications * 100) }}%)</span>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">Total</span>
              <span class="value" style="font-weight: 600;">{{ data.summary.totalNotifications }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🔴 Urgent</span>
              <span class="value">{{ data.summary.urgentNotifications }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">⚪ Non-urgent</span>
              <span class="value">{{ data.summary.nonUrgentNotifications }}</span>
            </div>
          </div>
          <div class="section-title">Action Breakdown</div>
          <div class="ios-card">
            <div v-for="(count, action) in data.summary.notificationActions" :key="action" class="ios-card-row" style="flex-direction: column; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span class="label">{{ action }}</span>
                <span class="value">{{ count }}</span>
              </div>
              <div style="height: 4px; background: var(--bg-card-secondary); border-radius: 2px; overflow: hidden;">
                <div :style="{ width: (count / getMaxNotificationAction() * 100) + '%', background: '#007AFF' }"></div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Summarization'">
          <div class="section-title">AI Summarization Performance</div>
          <div class="ios-card">
            <!-- Success Rate Gauge -->
            <div v-if="data.summary.summarizationTotal > 0" style="display: flex; justify-content: center; margin-bottom: 16px;">
              <div style="position: relative; width: 80px; height: 80px;">
                <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-card-secondary)" stroke-width="10"></circle>
                  <circle cx="50" cy="50" r="40" fill="none" :stroke="data.summary.summarizationErrors > 0 ? '#FF3B30' : '#34C759'" stroke-width="8" :stroke-dasharray="'251.2'" :stroke-dashoffset="251.2 - (251.2 * (data.summary.summarizationTotal - data.summary.summarizationErrors) / data.summary.summarizationTotal)" stroke-linecap="round"></circle>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                  <div style="font-size: 18px; font-weight: 700;">{{ Math.round((data.summary.summarizationTotal - data.summary.summarizationErrors) / data.summary.summarizationTotal * 100) }}%</div>
                  <div style="font-size: 9px; color: var(--text-tertiary);">Success</div>
                </div>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">Total Attempts</span>
              <span class="value">{{ data.summary.summarizationTotal }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">✅ Successful</span>
              <span class="value" style="color: #34C759;">{{ data.summary.summarizationTotal - data.summary.summarizationErrors }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">❌ Errors</span>
              <span class="value" :style="{ color: data.summary.summarizationErrors > 0 ? '#FF3B30' : '#34C759' }">{{ data.summary.summarizationErrors }}</span>
            </div>
          </div>
          <div class="section-title">Exit Reasons</div>
          <div class="ios-card">
            <div v-for="(count, reason) in data.summary.summarizationExitReasons" :key="reason" class="ios-card-row" style="flex-direction: column; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span class="label">Reason {{ reason }}</span>
                <span class="value">{{ count }}</span>
              </div>
              <div style="height: 4px; background: var(--bg-card-secondary); border-radius: 2px; overflow: hidden;">
                <div :style="{ width: (count / getMaxSummarizationReason() * 100) + '%', background: '#5856D6' }"></div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Security'">
          <div class="section-title">Threat Level Analysis</div>
          <div class="ios-card">
            <!-- Security Threat Gauge -->
            <div v-if="securityTotal > 0" style="display: flex; justify-content: center; margin-bottom: 16px;">
              <div style="position: relative; width: 80px; height: 80px;">
                <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--bg-card-secondary)" stroke-width="10"></circle>
                  <circle cx="50" cy="50" r="40" fill="none" :stroke="securityTotal > 0 ? '#FF3B30' : '#34C759'" stroke-width="8" :stroke-dasharray="'251.2'" :stroke-dashoffset="securityTotal > 0 ? 251.2 - (251.2 * 0.3) : 251.2" stroke-linecap="round"></circle>
                </svg>
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                  <div style="font-size: 24px;">{{ securityTotal > 0 ? '⚠️' : '✅' }}</div>
                  <div style="font-size: 9px; color: var(--text-tertiary);">{{ securityTotal > 0 ? 'Issues' : 'Clean' }}</div>
                </div>
              </div>
            </div>
            <!-- Threat Distribution -->
            <div v-if="securityTotal > 0" style="margin-bottom: 16px;">
              <div style="display: flex; height: 12px; border-radius: 6px; overflow: hidden; background: var(--bg-card-secondary);">
                <div v-if="data.summary.securitySuspiciousVisits > 0" :style="{ width: (data.summary.securitySuspiciousVisits / securityTotal * 100) + '%', background: '#FF3B30' }"></div>
                <div v-if="data.summary.securitySuspiciousGeneral > 0" :style="{ width: (data.summary.securitySuspiciousGeneral / securityTotal * 100) + '%', background: '#FF9500' }"></div>
                <div v-if="data.summary.securitySuspiciousOther > 0" :style="{ width: (data.summary.securitySuspiciousOther / securityTotal * 100) + '%', background: '#FFCC00' }"></div>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">🔴 Suspicious Visits</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousVisits > 0 ? '#FF3B30' : 'inherit' }">{{ data.summary.securitySuspiciousVisits }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🟠 General Suspicious</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousGeneral > 0 ? '#FF9500' : 'inherit' }">{{ data.summary.securitySuspiciousGeneral }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🟡 Other Suspicious</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousOther > 0 ? '#FFCC00' : 'inherit' }">{{ data.summary.securitySuspiciousOther }}</span>
            </div>
          </div>
        </template>

        <!-- Generic category detail with event graphs -->
        <template v-else>
          <div class="section-title">Events ({{ selectedCategory.uniqueTypes }} types)</div>
          <div class="ios-card" v-for="(events, eventName) in getGroupedEvents(selectedCategory)" :key="eventName">
            <div class="ios-card-header">{{ getEventDisplayName(eventName as string) }}</div>
            <div v-for="(evt, i) in (events as any[]).slice(0, 10)" :key="i" class="ios-card-row">
              <span class="label" style="font-size: 14px; font-family: monospace; max-width: 70%; white-space: normal;">
                {{ formatMessage(evt.message) }}
              </span>
              <span class="value">×{{ evt.message.Count || 1 }}</span>
            </div>
            <div v-if="(events as any[]).length > 10" class="ios-card-row" style="justify-content: center;">
              <span style="color: var(--accent); font-size: 14px;">+ {{ (events as any[]).length - 10 }} more</span>
            </div>
          </div>
        </template>
      </template>

      <!-- Event Detail Modal -->
      <template v-else-if="selectedEventName">
        <div class="nav-header">
          <div class="nav-back" @click="selectedEventName = null">‹</div>
          <div class="nav-title">Event Detail</div>
        </div>
        <div class="section-title" style="font-size: 16px; word-break: break-all;">{{ getEventDisplayName(selectedEventName) }}</div>
        <div class="ios-card">
          <div class="ios-card-header">Raw Data ({{ getEventsForName(selectedEventName).length }} entries)</div>
          <div
            v-for="(evt, i) in getEventsForName(selectedEventName).slice(0, 50)"
            :key="i"
            class="ios-card-row"
            style="flex-direction: column; align-items: stretch; gap: 4px;"
          >
            <div v-for="(val, key) in evt.message" :key="key" style="display: flex; justify-content: space-between; font-size: 13px;">
              <span style="color: var(--text-tertiary);">{{ key }}</span>
              <span style="color: var(--text-primary); font-family: monospace; max-width: 60%; text-align: right; word-break: break-all;">{{ val === null ? 'null' : val }}</span>
            </div>
            <div v-if="i < getEventsForName(selectedEventName).length - 1" style="border-bottom: 0.5px solid var(--separator); margin-top: 4px;"></div>
          </div>
        </div>
      </template>

      <!-- Main Tab Views -->
      <template v-else>
        <!-- Overview Tab -->
        <div v-show="activeTab === 'overview'">
          <div class="large-header">
            <h1>Analytics</h1>
            <p>{{ data.header?.os_version || 'iOS Device' }} · {{ formatDate(data.header?.timestamp) }}</p>
          </div>

          <!-- Key Metrics Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 0 20px 16px;">
            <div class="metric-tile fade-in fade-in-delay-1">
              <div class="metric-value" style="color: #007AFF;">{{ data.totalEvents }}</div>
              <div class="metric-label">Total Events</div>
            </div>
            <div class="metric-tile fade-in fade-in-delay-2">
              <div class="metric-value" style="color: #5856D6;">{{ data.uniqueEventTypes }}</div>
              <div class="metric-label">Event Types</div>
            </div>
            <div class="metric-tile fade-in fade-in-delay-3">
              <div class="metric-value" style="color: #FF9500;">{{ data.summary.totalJetsamKills }}</div>
              <div class="metric-label">Process Kills</div>
            </div>
            <div class="metric-tile fade-in fade-in-delay-4">
              <div class="metric-value" style="color: #34C759;">{{ data.summary.totalNotifications }}</div>
              <div class="metric-label">Notifications</div>
            </div>
          </div>

          <!-- Device Info Card -->
          <div class="section-subtitle">Device Information</div>
          <div class="ios-card fade-in">
            <div class="ios-card-row" v-if="data.header">
              <span class="label">OS Version</span>
              <span class="value">{{ data.header.os_version }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Storage</span>
              <span class="value">{{ data.metadata.deviceCapacity }} GB</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">RAM</span>
              <span class="value">{{ data.metadata.dramSize }} GB</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Carrier</span>
              <span class="value">{{ data.metadata.homeCarrierName }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Country</span>
              <span class="value">{{ data.metadata.currentCountry }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Language</span>
              <span class="value">{{ data.metadata._preferredUserInterfaceLanguage }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Dual SIM</span>
              <span class="value">{{ data.metadata.isDualSim ? '✅ Yes' : '❌ No' }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Apple Intelligence</span>
              <span class="value">{{ data.metadata.isGreyMatterAvailable ? '✅ Available' : '❌ N/A' }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Wi-Fi Chipset</span>
              <span class="value">{{ data.metadata.WiFiChipset }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Baseband</span>
              <span class="value">{{ data.metadata.basebandChipset }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Top Categories</span>
              <span class="value">{{ topCategoriesFormatted }}</span>
            </div>
          </div>

          <!-- Quick Summary Cards -->
          <div class="section-subtitle">Quick Summary</div>

          <!-- Notifications Card with Pie Chart Visualization -->
          <div class="ios-card fade-in" @click="openCategory('Notifications')" style="cursor: pointer;">
            <div class="ios-card-header" style="justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">🔔 Notifications</span>
              <span class="badge" style="background: rgba(255,59,48,0.1); color: #FF3B30;">{{ data.summary.totalNotifications }}</span>
            </div>
            <!-- Visual: Urgent vs Non-Urgent Bar -->
            <div v-if="data.summary.totalNotifications > 0" style="margin: 12px 4px;">
              <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--bg-card-secondary);">
                <div :style="{ width: (data.summary.urgentNotifications / data.summary.totalNotifications * 100) + '%', background: '#FF3B30' }"></div>
                <div :style="{ width: (data.summary.nonUrgentNotifications / data.summary.totalNotifications * 100) + '%', background: '#8E8E93' }"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px;">
                <span style="color: #FF3B30;">🔴 {{ Math.round(data.summary.urgentNotifications / data.summary.totalNotifications * 100) }}%</span>
                <span style="color: #8E8E93;">⚪ {{ Math.round(data.summary.nonUrgentNotifications / data.summary.totalNotifications * 100) }}%</span>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">Urgent</span>
              <span class="value" style="color: #FF3B30; font-weight: 600;">{{ data.summary.urgentNotifications }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Non-urgent</span>
              <span class="value">{{ data.summary.nonUrgentNotifications }}</span>
            </div>
            <div v-if="Object.keys(data.summary.notificationActions).length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--separator);">
              <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px;">Top Actions</div>
              <div v-for="(count, action) in topNotificationActions" :key="action" class="ios-card-row" style="padding: 8px 0;">
                <span class="label" style="font-size: 12px;">{{ action }}</span>
                <span class="value" style="font-size: 12px;">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- Memory/Jetsam Card with Process Chart -->
          <div class="ios-card fade-in" @click="openCategory('Memory (Jetsam)')" style="cursor: pointer;">
            <div class="ios-card-header" style="justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">🧠 Memory Management</span>
              <span class="badge" style="background: rgba(255,149,0,0.1); color: #FF9500;">{{ data.summary.totalJetsamKills }} kills</span>
            </div>
            <!-- Visual: Top processes bar chart -->
            <div v-if="data.summary.jetsamTopProcesses.length > 0" style="margin: 12px 4px;">
              <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 8px;">Top Processes (by kill count)</div>
              <div v-for="(proc, i) in data.summary.jetsamTopProcesses.slice(0, 5)" :key="i" style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
                <span style="font-size: 11px; color: var(--text-tertiary); width: 16px;">{{ i + 1 }}</span>
                <div style="flex: 1; height: 6px; background: var(--bg-card-secondary); border-radius: 3px; overflow: hidden;">
                  <div :style="{ width: (proc.count / data.summary.jetsamTopProcesses[0].count * 100) + '%', background: i < 3 ? '#FF9500' : '#8E8E93' }"></div>
                </div>
                <span style="font-size: 11px; font-family: monospace; max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ proc.name }}</span>
                <span style="font-size: 11px; color: #FF9500; min-width: 30px; text-align: right;">{{ proc.count }}</span>
              </div>
            </div>
            <!-- Kill Reasons Visualization -->
            <div v-if="Object.keys(data.summary.jetsamReasons).length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--separator);">
              <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px;">Kill Reasons</div>
              <div v-for="(count, reason) in data.summary.jetsamReasons" :key="reason" class="ios-card-row" style="padding: 8px 0;">
                <span class="label" style="font-size: 12px;">{{ reason }}</span>
                <span class="value" style="font-size: 12px; color: #FF9500;">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- AI Summarization Card with Error Rate -->
          <div class="ios-card fade-in" @click="openCategory('Summarization')" style="cursor: pointer;">
            <div class="ios-card-header" style="justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">📝 AI Summarization</span>
              <span class="badge" style="background: rgba(88,86,214,0.1); color: #5856D6;">{{ data.summary.summarizationTotal }}</span>
            </div>
            <!-- Visual: Error Rate -->
            <div v-if="data.summary.summarizationTotal > 0" style="margin: 12px 4px;">
              <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--bg-card-secondary);">
                <div :style="{ width: ((data.summary.summarizationTotal - data.summary.summarizationErrors) / data.summary.summarizationTotal * 100) + '%', background: '#34C759' }"></div>
                <div :style="{ width: (data.summary.summarizationErrors / data.summary.summarizationTotal * 100) + '%', background: '#FF3B30' }"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px; font-size: 11px;">
                <span style="color: #34C759;">✅ {{ Math.round((data.summary.summarizationTotal - data.summary.summarizationErrors) / data.summary.summarizationTotal * 100) }}% success</span>
                <span style="color: #FF3B30;">❌ {{ Math.round(data.summary.summarizationErrors / data.summary.summarizationTotal * 100) }}% errors</span>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">Total Attempts</span>
              <span class="value">{{ data.summary.summarizationTotal }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Successful</span>
              <span class="value" style="color: #34C759;">{{ data.summary.summarizationTotal - data.summary.summarizationErrors }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Errors</span>
              <span class="value" :style="{ color: data.summary.summarizationErrors > 0 ? '#FF3B30' : '#34C759' }">{{ data.summary.summarizationErrors }}</span>
            </div>
            <!-- Exit Reasons -->
            <div v-if="Object.keys(data.summary.summarizationExitReasons).length > 0" style="margin-top: 8px; padding-top: 8px; border-top: 0.5px solid var(--separator);">
              <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: 6px;">Exit Reasons</div>
              <div v-for="(count, reason) in data.summary.summarizationExitReasons" :key="reason" class="ios-card-row" style="padding: 8px 0;">
                <span class="label" style="font-size: 12px;">{{ reason }}</span>
                <span class="value" style="font-size: 12px;">{{ count }}</span>
              </div>
            </div>
          </div>

          <!-- Security Card with Threat Visualization -->
          <div class="ios-card fade-in" @click="openCategory('Security')" style="cursor: pointer;">
            <div class="ios-card-header" style="justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">🛡️ Security</span>
              <span class="badge" :style="{ background: securityTotal > 0 ? 'rgba(255,45,85,0.1)' : 'rgba(52,199,89,0.1)', color: securityTotal > 0 ? '#FF2D55' : '#34C759' }">{{ securityScore }}</span>
            </div>
            <!-- Visual: Threat Level Indicator -->
            <div v-if="securityTotal > 0" style="margin: 12px 4px;">
              <div style="display: flex; height: 6px; border-radius: 3px; overflow: hidden; background: var(--bg-card-secondary);">
                <div v-if="data.summary.securitySuspiciousVisits > 0" :style="{ width: (data.summary.securitySuspiciousVisits / securityTotal * 100) + '%', background: '#FF3B30' }"></div>
                <div v-if="data.summary.securitySuspiciousGeneral > 0" :style="{ width: (data.summary.securitySuspiciousGeneral / securityTotal * 100) + '%', background: '#FF9500' }"></div>
                <div v-if="data.summary.securitySuspiciousOther > 0" :style="{ width: (data.summary.securitySuspiciousOther / securityTotal * 100) + '%', background: '#FFCC00' }"></div>
              </div>
            </div>
            <div class="ios-card-row">
              <span class="label">🔴 Suspicious Visits</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousVisits > 0 ? '#FF3B30' : 'inherit' }">{{ data.summary.securitySuspiciousVisits }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🟠 General Suspicious</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousGeneral > 0 ? '#FF9500' : 'inherit' }">{{ data.summary.securitySuspiciousGeneral }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🟡 Other Suspicious</span>
              <span class="value" :style="{ color: data.summary.securitySuspiciousOther > 0 ? '#FFCC00' : 'inherit' }">{{ data.summary.securitySuspiciousOther }}</span>
            </div>
          </div>

          <!-- Generative AI & Stability Card -->
          <div class="ios-card fade-in">
            <div class="ios-card-header">✨ Generative AI &amp; Intelligence</div>
            <!-- AI Events Visualization -->
            <div style="margin: 12px 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="label">AI Events</span>
                <span class="value" style="color: #AF52DE; font-weight: 600;">{{ data.summary.generativeAIEvents }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(100, data.summary.generativeAIEvents / 100) + '%', background: '#AF52DE' }"></div>
              </div>
            </div>
            <!-- Stability Visualization -->
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                <span class="label">Stability Heartbeats</span>
                <span class="value" :style="{ color: data.summary.stabilityHeartbeats > 100 ? '#34C759' : '#FF9500' }">{{ data.summary.stabilityHeartbeats }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(100, data.summary.stabilityHeartbeats / 200 * 100) + '%', background: data.summary.stabilityHeartbeats > 100 ? '#34C759' : '#FF9500' }"></div>
              </div>
              <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">{{ data.summary.stabilityHeartbeats > 100 ? '✅ System stable' : '⚠️ Low stability' }}</div>
            </div>
          </div>

          <!-- Connectivity & Device Card -->
          <div class="ios-card fade-in" @click="openCategory('Connectivity')" style="cursor: pointer;">
            <div class="ios-card-header">📶 Connectivity</div>
            <div class="ios-card-row" v-if="data.summary.lpmStatus && data.summary.lpmStatus.length > 0">
              <span class="label">Low Power Mode Events</span>
              <span class="value">{{ data.summary.lpmStatus.length }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Wi-Fi Chipset</span>
              <span class="value" style="font-size: 12px;">{{ data.metadata.WiFiChipset || 'N/A' }}</span>
            </div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Baseband</span>
              <span class="value" style="font-size: 12px;">{{ data.metadata.basebandChipset || 'N/A' }}</span>
            </div>
          </div>

          <!-- HomeKit & Mail & Safari Summary -->
          <div class="ios-card fade-in">
            <div class="ios-card-header">🏠 HomeKit · 📧 Mail · 🧭 Safari</div>
            <div class="ios-card-row">
              <span class="label">🏠 HomeKit Errors</span>
              <span class="value" :style="{ color: data.summary.homeKitErrors > 0 ? '#FF9500' : '#34C759' }">{{ data.summary.homeKitErrors }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🏠 HomeKit Notifications</span>
              <span class="value">{{ data.summary.homeKitNotifications }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">📧 Mail Events</span>
              <span class="value">{{ data.summary.mailEvents }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">🧭 Safari Events</span>
              <span class="value">{{ data.summary.safariEvents }}</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">📊 Analytics Period</div>
            <div class="ios-card-row" v-if="data.metadata">
              <span class="label">Start Time</span>
              <span class="value">{{ formatTimestamp(data.metadata.startTimestamp) }}</span>
            </div>
            <div class="ios-card-row" v-if="data.header">
              <span class="label">Generated</span>
              <span class="value">{{ formatDate(data.header.timestamp) }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Period</span>
              <span class="value">Daily</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Unique Devices</span>
              <span class="value">{{ data.deviceIds.length }}</span>
            </div>
          </div>
        </div>

        <!-- Categories Tab -->
        <div v-show="activeTab === 'categories'">
          <div class="large-header">
            <h1>Categories</h1>
            <p>{{ data.categories.length }} event categories found</p>
          </div>
          <div
            v-for="(cat, i) in data.categories"
            :key="i"
            class="ios-card fade-in"
            style="cursor: pointer;"
            @click="openCategory(cat.name)"
          >
            <div class="ios-card-header" style="justify-content: space-between;">
              <span style="display: flex; align-items: center; gap: 8px;">
                {{ cat.icon }} {{ cat.name }}
              </span>
              <span class="badge" :style="{ background: cat.color + '22', color: cat.color }">
                {{ cat.eventCount }}
              </span>
            </div>
            <div style="padding: 0 4px 12px;">
              <div style="font-size: 13px; color: var(--text-tertiary); margin-bottom: 8px;">{{ cat.description }}</div>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: (cat.eventCount / data.totalEvents * 100) + '%', background: cat.color }"
                ></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 4px;">
                <span style="font-size: 11px; color: var(--text-tertiary);">{{ cat.uniqueTypes }} event types</span>
                <span style="font-size: 11px; color: var(--text-tertiary);">{{ Math.round(cat.eventCount / data.totalEvents * 100) }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Events Tab -->
        <div v-show="activeTab === 'events'">
          <div class="large-header">
            <h1>All Events</h1>
            <p>{{ data.uniqueEventTypes }} unique event types</p>
          </div>

          <!-- Search -->
          <div style="padding: 0 20px 16px;">
            <input
              v-model="eventSearch"
              type="text"
              placeholder="Search events..."
              style="width: 100%; padding: 10px 14px; border-radius: 10px; border: none; background: var(--bg-card); color: var(--text-primary); font-size: 16px; outline: none; box-shadow: 0 0 0 0.5px var(--separator);"
            />
          </div>

          <div
            v-for="name in filteredEventNames"
            :key="name"
            class="ios-card"
            style="cursor: pointer;"
            @click="selectedEventName = name"
          >
            <div class="ios-card-row">
              <span class="label" style="font-size: 14px; max-width: 80%; white-space: normal; line-height: 1.4;">{{ getEventDisplayName(name) }}</span>
              <span class="value" style="font-weight: 600;">{{ getEventsForName(name).length }}</span>
            </div>
          </div>
        </div>

        <!-- File Info Tab -->
        <div v-show="activeTab === 'file'">
          <div class="large-header">
            <h1>File Info</h1>
            <p>{{ fileName || 'Analytics File' }}</p>
          </div>

          <div class="ios-card">
            <div class="ios-card-header">File Details</div>
            <div class="ios-card-row">
              <span class="label">File Name</span>
              <span class="value">{{ fileName || 'Unknown' }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">File Size</span>
              <span class="value">{{ fileSizeFormatted }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Total Lines</span>
              <span class="value">{{ data.totalEvents + 2 }}</span>
            </div>
          </div>

          <div class="ios-card">
            <div class="ios-card-header">Raw Metadata</div>
            <div v-for="(val, key) in data.metadata" :key="key" class="ios-card-row">
              <template v-if="val !== null && val !== '' && typeof val !== 'object'">
                <span class="label" style="font-size: 13px; font-family: monospace;">{{ key }}</span>
                <span class="value" style="font-size: 13px;">{{ val }}</span>
              </template>
            </div>
          </div>

          <!-- Open new file -->
          <div style="padding: 24px 16px;">
            <button
              @click="resetFile"
              style="width: 100%; padding: 14px; border-radius: 12px; border: none; background: #FF3B30; color: white; font-size: 16px; font-weight: 600; cursor: pointer;"
            >
              Open Another File
            </button>
          </div>
        </div>

        <!-- About Tab -->
        <div v-show="activeTab === 'about'">
          <div class="large-header">
            <h1>About</h1>
            <p>Analytics Viewer for iOS</p>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">📱 App Information</div>
            <div class="ios-card-row">
              <span class="label">App Name</span>
              <span class="value">Analytics Viewer</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Version</span>
              <span class="value">1.0.0</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Platform</span>
              <span class="value">iOS / Capacitor</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Framework</span>
              <span class="value">Vue 3 + TypeScript</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">📊 Supported Analytics</div>
            <div class="ios-card-row">
              <span class="label">File Format</span>
              <span class="value">.ips (iPhone Analytics)</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Event Types</span>
              <span class="value">168+ categories</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Data Points</span>
              <span class="value">Memory, Battery, Notifications, Security, AI, and more</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">🎨 Features</div>
            <div class="ios-card-row">
              <span class="label">Visualizations</span>
              <span class="value">Charts, graphs, gauges</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Categories</span>
              <span class="value">Event grouping & filtering</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Search</span>
              <span class="value">Full-text event search</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Export</span>
              <span class="value">Share analytics files</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">📁 How to Use</div>
            <div class="ios-card-row" style="flex-direction: column; align-items: flex-start; gap: 8px;">
              <span class="label" style="font-size: 14px;">1. Get Analytics File</span>
              <span style="font-size: 13px; color: var(--text-tertiary);">On iPhone: Settings → Privacy & Security → Analytics & Improvements → Analytics Data</span>
            </div>
            <div class="ios-card-row" style="flex-direction: column; align-items: flex-start; gap: 8px;">
              <span class="label" style="font-size: 14px;">2. Transfer to Computer</span>
              <span style="font-size: 13px; color: var(--text-tertiary);">Use Finder/iTunes, AirDrop, or iCloud Drive</span>
            </div>
            <div class="ios-card-row" style="flex-direction: column; align-items: flex-start; gap: 8px;">
              <span class="label" style="font-size: 14px;">3. Open in App</span>
              <span style="font-size: 13px; color: var(--text-tertiary);">Tap "Open File" and select the .ips file</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">🔧 Technical Details</div>
            <div class="ios-card-row">
              <span class="label">Parser</span>
              <span class="value">Custom TypeScript</span>
            </div>
            <div class="ios-card-row">
              <span class="label">UI Framework</span>
              <span class="value">Tailwind CSS</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Build Tool</span>
              <span class="value">Vite</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Icons</span>
              <span class="value">SVG + Emoji</span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">⚖️ Privacy</div>
            <div class="ios-card-row" style="flex-direction: column; align-items: flex-start;">
              <span style="font-size: 13px; color: var(--text-tertiary); line-height: 1.5;">
                This app processes analytics data locally on your device. No data is sent to any server. 
                All parsing and visualization happens in your browser/app.
              </span>
            </div>
          </div>

          <div class="ios-card fade-in">
            <div class="ios-card-header">📋 Event Categories Supported</div>
            <div style="padding: 12px 0; font-size: 13px; color: var(--text-tertiary); line-height: 1.8;">
              <div>• Memory (Jetsam) - Process kills, memory pressure</div>
              <div>• Device & Power - Battery states, power consumption</div>
              <div>• Notifications - Push notifications, actions</div>
              <div>• Summarization - AI summarization stats</div>
              <div>• Security - Suspicious activity detection</div>
              <div>• Generative AI - Apple Intelligence events</div>
              <div>• Stability - System heartbeats, crashes</div>
              <div>• Connectivity - WiFi, cellular, Bluetooth</div>
              <div>• HomeKit - Smart home device events</div>
              <div>• Mail - Email-related analytics</div>
              <div>• Safari - Browser analytics</div>
              <div>• And 150+ more categories...</div>
            </div>
          </div>

          <div style="padding: 24px 16px; text-align: center;">
            <span style="font-size: 12px; color: var(--text-tertiary);">
              Made with ❤️ for iOS developers
            </span>
            <br><br>
            <span style="font-size: 14px; color: var(--text-primary); font-weight: 600;">
              Developed by JPHsystems
            </span>
          </div>
        </div>
      </template>

      <!-- Tab Bar -->
      <div class="tab-bar" v-if="!selectedCategory && !selectedEventName">
        <div
          v-for="tab in tabs"
          :key="tab.id"
          class="tab-item"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <span class="icon">{{ tab.icon }}</span>
          <span>{{ tab.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { parseAnalyticsFile, getEventDisplayName, type ParsedAnalytics, type EventCategorySummary } from './parser/analytics-parser'

const isDark = ref(false)
const isDragOver = ref(false)
const data = ref<ParsedAnalytics | null>(null)
const fileName = ref('')
const fileSize = ref(0)
const activeTab = ref('overview')
const selectedCategory = ref<EventCategorySummary | null>(null)
const selectedEventName = ref<string | null>(null)
const eventSearch = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const tabs = [
  { id: 'overview', icon: '📋', label: 'Overview' },
  { id: 'categories', icon: '📁', label: 'Categories' },
  { id: 'events', icon: '📊', label: 'Events' },
  { id: 'file', icon: '📄', label: 'File' },
  { id: 'about', icon: 'ℹ️', label: 'About' },
]

// Detect dark mode
onMounted(() => {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  isDark.value = mq.matches
  mq.addEventListener('change', (e) => { isDark.value = e.matches })

  // Listen for file open from native iOS
  window.handleFileFromNative = (base64Content: string, fName: string) => {
    try {
      const binary = atob(base64Content)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const content = new TextDecoder().decode(bytes)
      fileName.value = fName
      fileSize.value = bytes.length
      data.value = parseAnalyticsFile(content)
    } catch (e) {
      alert('Failed to parse file: ' + (e as Error).message)
    }
  }

  // Check URL params for file
  const params = new URLSearchParams(window.location.search)
  const fileUrl = params.get('file')
  if (fileUrl) {
    fetch(fileUrl).then(r => r.text()).then(content => {
      fileName.value = fileUrl.split('/').pop() || 'Analytics'
      fileSize.value = content.length
      data.value = parseAnalyticsFile(content)
    }).catch(() => {})
  }
})

const topCategoriesFormatted = computed(() => {
  if (!data.value?.metadata) return ''
  const m = data.value.metadata
  return [m.TopCategory1, m.TopCategory2, m.TopCategory3].filter(Boolean).join(', ')
})

const securityScore = computed(() => {
  if (!data.value) return '✅ Clean'
  const s = data.value.summary
  const total = s.securitySuspiciousVisits + s.securitySuspiciousGeneral + s.securitySuspiciousOther
  if (total === 0) return '✅ No Issues'
  return `⚠️ ${total} flags`
})

const securityTotal = computed(() => {
  if (!data.value) return 0
  const s = data.value.summary
  return s.securitySuspiciousVisits + s.securitySuspiciousGeneral + s.securitySuspiciousOther || 1
})

const topNotificationActions = computed(() => {
  if (!data.value?.summary?.notificationActions) return {}
  const actions = data.value.summary.notificationActions
  // Sort by count and return top 3
  return Object.entries(actions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .reduce((acc, [key, val]) => { acc[key] = val; return acc }, {} as Record<string, number>)
})

const fileSizeFormatted = computed(() => {
  if (fileSize.value < 1024) return `${fileSize.value} B`
  if (fileSize.value < 1024 * 1024) return `${(fileSize.value / 1024).toFixed(1)} KB`
  return `${(fileSize.value / 1024 / 1024).toFixed(2)} MB`
})

const filteredEventNames = computed(() => {
  if (!data.value) return []
  const names = Array.from(data.value.eventGroups.keys()).sort()
  if (!eventSearch.value) return names
  const q = eventSearch.value.toLowerCase()
  return names.filter(n => n.toLowerCase().includes(q) || getEventDisplayName(n).toLowerCase().includes(q))
})

function openFilePicker() {
  fileInput.value?.click()
}

function handleFileInput(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) loadFile(file)
}

function handleDrop(e: DragEvent) {
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) loadFile(file)
}

function loadFile(file: File) {
  fileName.value = file.name
  fileSize.value = file.size
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      data.value = parseAnalyticsFile(content)
    } catch (err) {
      alert('Failed to parse file: ' + (err as Error).message)
    }
  }
  reader.readAsText(file)
}

function resetFile() {
  data.value = null
  fileName.value = ''
  fileSize.value = 0
  selectedCategory.value = null
  selectedEventName.value = null
  activeTab.value = 'overview'
}

function openCategory(name: string) {
  const cat = data.value?.categories.find(c => c.name === name)
  if (cat) selectedCategory.value = cat
}

function getEventsForName(name: string) {
  return data.value?.eventGroups.get(name) || []
}

function getGroupedEvents(cat: EventCategorySummary) {
  const groups: Record<string, any[]> = {}
  for (const evt of cat.events) {
    if (!groups[evt.name]) groups[evt.name] = []
    groups[evt.name].push(evt)
  }
  return groups
}

function formatMessage(msg: Record<string, any>): string {
  const parts = Object.entries(msg)
    .filter(([k, v]) => v !== null && k !== 'Count')
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${v}`)
  return parts.join(' · ')
}

function formatDate(ts?: string): string {
  if (!ts) return 'Unknown'
  try {
    return new Date(ts.replace(' +', '+').replace(' ', 'T')).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    })
  } catch { return ts }
}

function formatTimestamp(ts: string): string {
  try {
    return new Date(ts).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  } catch { return ts }
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  return `${(seconds / 3600).toFixed(1)}h`
}

// Helper computed properties for category detail view graphs
const jetsamTotalKills = computed(() => {
  if (!data.value?.summary?.jetsamReasons) return 1
  return Object.values(data.value.summary.jetsamReasons).reduce((a, b) => a + b, 0) || 1
})

const urgentDegrees = computed(() => {
  if (!data.value?.summary?.totalNotifications) return 0
  return (data.value.summary.urgentNotifications / data.value.summary.totalNotifications) * 360
})

function getMaxDuration(): number {
  if (!data.value?.summary?.batteryStates) return 1
  return Math.max(...data.value.summary.batteryStates.map(s => s.duration)) || 1
}

function getMaxNotificationAction(): number {
  if (!data.value?.summary?.notificationActions) return 1
  return Math.max(...Object.values(data.value.summary.notificationActions)) || 1
}

function getMaxSummarizationReason(): number {
  if (!data.value?.summary?.summarizationExitReasons) return 1
  return Math.max(...Object.values(data.value.summary.summarizationExitReasons)) || 1
}

function getEventPercentage(events: any[], cat: EventCategorySummary): number {
  if (!cat.eventCount) return 0
  return Math.round((events.length / cat.eventCount) * 100)
}

// Computed property for category top events to use in template
const categoryTopEvents = computed(() => {
  if (!selectedCategory.value) return []
  const groups = getGroupedEvents(selectedCategory.value)
  const entries = Object.entries(groups).slice(0, 8)
  return entries.map(([eventName, events]) => ({
    eventName,
    count: (events as any[]).length,
    percentage: getEventPercentage(events as any[], selectedCategory.value!)
  }))
})
</script>
