<template>
  <div class="app" :class="{ dark: isDark }">
    <!-- Welcome Screen -->
    <div v-if="!data" class="welcome-container">
      <div class="welcome-icon">📊</div>
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
        <div style="padding: 12px 16px; font-size: 14px; color: var(--text-tertiary);">
          {{ selectedCategory.description }}
        </div>

        <!-- Category-specific detail views -->
        <template v-if="selectedCategory.name === 'Memory (Jetsam)'">
          <div class="section-title">Top Killed Processes</div>
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
              <div class="process-count">×{{ proc.count }}</div>
            </div>
          </div>
          <div class="section-title">Kill Reasons</div>
          <div class="ios-card">
            <div v-for="(count, reason) in data.summary.jetsamReasons" :key="reason" class="ios-card-row">
              <span class="label">{{ reason }}</span>
              <span class="value">{{ count }} kills</span>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Device & Power'">
          <div class="section-title">Power States</div>
          <div class="ios-card">
            <div v-for="(state, i) in data.summary.batteryStates" :key="i" class="ios-card-row" style="flex-direction: column; align-items: stretch;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                <span class="label">{{ state.state }}</span>
                <span class="value">{{ state.count }} samples · {{ formatDuration(state.duration) }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(100, Math.abs(state.energy) / 20) + '%', background: state.energy >= 0 ? '#34C759' : '#FF3B30' }"></div>
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Notifications'">
          <div class="section-title">Notification Breakdown</div>
          <div class="ios-card">
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
          <div class="section-title">Actions</div>
          <div class="ios-card">
            <div v-for="(count, action) in data.summary.notificationActions" :key="action" class="ios-card-row">
              <span class="label">{{ action }}</span>
              <span class="value">{{ count }}</span>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Summarization'">
          <div class="section-title">Pipeline Statistics</div>
          <div class="ios-card">
            <div class="ios-card-row">
              <span class="label">Total Attempts</span>
              <span class="value">{{ data.summary.summarizationTotal }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Errors</span>
              <span class="value" :style="{ color: data.summary.summarizationErrors > 0 ? '#FF3B30' : '#34C759' }">{{ data.summary.summarizationErrors }}</span>
            </div>
          </div>
          <div class="section-title">Exit Reasons</div>
          <div class="ios-card">
            <div v-for="(count, reason) in data.summary.summarizationExitReasons" :key="reason" class="ios-card-row">
              <span class="label">Reason {{ reason }}</span>
              <span class="value">{{ count }}</span>
            </div>
          </div>
        </template>

        <template v-else-if="selectedCategory.name === 'Security'">
          <div class="section-title">Threat Analysis</div>
          <div class="ios-card">
            <div class="ios-card-row">
              <span class="label">Suspicious Visits</span>
              <span class="value">{{ data.summary.securitySuspiciousVisits }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">General Suspicious</span>
              <span class="value">{{ data.summary.securitySuspiciousGeneral }}</span>
            </div>
            <div class="ios-card-row">
              <span class="label">Other Suspicious</span>
              <span class="value">{{ data.summary.securitySuspiciousOther }}</span>
            </div>
          </div>
        </template>

        <!-- Generic category detail -->
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
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 16px 12px;">
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
            <div v-if="data.summary.totalNotifications > 0" style="margin: 12px 0;">
              <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--bg-card-secondary);">
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
              <div v-for="(count, action) in topNotificationActions" :key="action" class="ios-card-row" style="padding: 4px 0;">
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
            <div v-if="data.summary.jetsamTopProcesses.length > 0" style="margin: 12px 0;">
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
              <div v-for="(count, reason) in data.summary.jetsamReasons" :key="reason" class="ios-card-row" style="padding: 4px 0;">
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
            <div v-if="data.summary.summarizationTotal > 0" style="margin: 12px 0;">
              <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--bg-card-secondary);">
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
              <div v-for="(count, reason) in data.summary.summarizationExitReasons" :key="reason" class="ios-card-row" style="padding: 4px 0;">
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
            <div v-if="securityTotal > 0" style="margin: 12px 0;">
              <div style="display: flex; height: 8px; border-radius: 4px; overflow: hidden; background: var(--bg-card-secondary);">
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
            <div style="margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <span class="label">AI Events</span>
                <span class="value" style="color: #AF52DE; font-weight: 600;">{{ data.summary.generativeAIEvents }}</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: Math.min(100, data.summary.generativeAIEvents / 100) + '%', background: '#AF52DE' }"></div>
              </div>
            </div>
            <!-- Stability Visualization -->
            <div style="margin-top: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
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
            <div style="padding: 0 16px 12px;">
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
          <div style="padding: 0 16px 12px;">
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
</script>
