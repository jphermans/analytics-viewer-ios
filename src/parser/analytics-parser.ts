export interface IPSHeader {
  bug_type: string;
  timestamp: string;
  os_version: string;
  roots_installed: number;
  incident_id: string;
}

export interface IPSMetadata {
  TopCategory1: string;
  TopCategory2: string;
  TopCategory3: string;
  WiFiChipset: string;
  _preferredUserInterfaceLanguage: string;
  _userInterfaceLanguage: string;
  _userSetRegionFormat: string;
  appStoreCountry: string;
  basebandChipset: string;
  basebandFirmwareVersion: string;
  configDbVersion: number;
  configUuid: string;
  currentCountry: string;
  deviceCapacity: number;
  dramSize: number;
  isDualSim: boolean;
  isGreyMatterAvailable: boolean;
  homeCarrierName: string;
  homeCarrierCountry: string;
  servingCarrierName: string;
  homeCarrierBundleVersion: string;
  productSku: string;
  rolloverReason: string;
  startTimestamp: string;
  stateDbType: string;
  stateDbVersion: number;
  submissionMode: string;
  version: string;
  market: string;
  optIn3rdParty: boolean;
  optInStatus: boolean;
  greyMatterCountryPolicy: string;
  trialExperiments: string;
  trialRollouts: string;
  [key: string]: any;
}

export interface AnalyticsEvent {
  aggregationPeriod: string;
  deviceId: string;
  message: Record<string, any>;
  name: string;
  numDaysAggregated: number;
  sampling: number;
  uuid: string;
}

export interface EventCategoryGroup {
  category: string;
  icon: string;
  color: string;
  eventNames: string[];
  description: string;
}

export interface ParsedAnalytics {
  header: IPSHeader | null;
  metadata: IPSMetadata | null;
  events: AnalyticsEvent[];
  eventGroups: Map<string, AnalyticsEvent[]>;
  categories: EventCategorySummary[];
  summary: AnalyticsSummary;
  totalEvents: number;
  uniqueEventTypes: number;
  deviceIds: string[];
}

export interface EventCategorySummary {
  name: string;
  icon: string;
  color: string;
  description: string;
  eventCount: number;
  uniqueTypes: number;
  events: AnalyticsEvent[];
}

export interface AnalyticsSummary {
  totalNotifications: number;
  urgentNotifications: number;
  nonUrgentNotifications: number;
  notificationActions: Record<string, number>;
  totalJetsamKills: number;
  jetsamTopProcesses: { name: string; count: number; reason: string }[];
  jetsamReasons: Record<string, number>;
  batteryStates: { state: string; count: number; energy: number; duration: number }[];
  lpmStatus: any[];
  summarizationTotal: number;
  summarizationErrors: number;
  summarizationExitReasons: Record<string, number>;
  securitySuspiciousVisits: number;
  securitySuspiciousGeneral: number;
  securitySuspiciousOther: number;
  generativeAIEvents: number;
  homeKitErrors: number;
  homeKitNotifications: number;
  mailEvents: number;
  safariEvents: number;
  stabilityHeartbeats: number;
  topCategories: string[];
}

const CATEGORY_DEFINITIONS: EventCategoryGroup[] = [
  {
    category: 'Device & Power',
    icon: '🔋',
    color: '#34C759',
    description: 'Battery, charging, power states, and energy metrics',
    eventNames: [
      'RawDeviceStateHistogram', 'BatteryConfigValueHistogramFinal_V1', 'BatteryConfigValueHistogramFinal_V2',
      'BatteryConfigValueHistogram_DOFU', 'LPMStatus', 'LPMStatusHistogram',
      'UnpluggedDurationEnergyViewNew', 'VacVoltageLimit', 'inductiveChargingParamsAggregateView',
      'OBC_PowerNPerf_Analysis', 'OBC_PowerNPerf_Analysis_v1', 'DroopCount', 'DroopCountv2', 'DroopCountv3'
    ]
  },
  {
    category: 'Notifications',
    icon: '🔔',
    color: '#FF3B30',
    description: 'Notification pipeline statistics and delivery',
    eventNames: ['NotificationPipelineStatisticsV4_noRotation']
  },
  {
    category: 'Summarization',
    icon: '📝',
    color: '#5856D6',
    description: 'AI-powered notification and content summarization',
    eventNames: [
      'SummarizationPipelineStatisticsV13_noRotation',
      'GenerativeExperiences_Summarization_InputTruncation',
      'GenerativeExperiences_Summarization_Input_Analysis',
      'GenerativeExperiences_Summarization_Latency',
      'GenerativeExperiences_Summarization_StreamingLatency',
      ...generateSummarizationEvents()
    ]
  },
  {
    category: 'Memory (Jetsam)',
    icon: '🧠',
    color: '#FF9500',
    description: 'Process termination and memory management',
    eventNames: ['JetsamAggregationV4']
  },
  {
    category: 'Security',
    icon: '🛡️',
    color: '#FF2D55',
    description: 'Suspicious activity detection and communication safety',
    eventNames: [
      'TaSuspiciousVisits1', 'TaSuspiciousGeneral1', 'TaSuspiciousOther1',
      'CommunicationSafetyEnabledCountHigherSampling'
    ]
  },
  {
    category: 'Generative AI',
    icon: '✨',
    color: '#AF52DE',
    description: 'On-device AI model management and inference',
    eventNames: [
      'GenerativeExperiences_API_RoundTrip',
      'GenerativeExperiences_Classification_Input_Analysis',
      'GenerativeExperiences_Classification_Latency',
      'GenerativeExperiences_Classification_Result',
      'GenerativeExperiences_Classification_Usage',
      'GenerativeFunctionEvent',
      'GenerativeModelsAvailability_Status',
      'GenerativeModelsAvailability_Status_90Days_v2_noRotation',
      'ModelManager_AssetEvent_v2',
      'ModelManager_InferenceEvent_90days_noRotation',
      'ModelManager_InferenceEvent_v2',
      'ModelManager_PrewarmEvent',
      'SpeculativeDecodingMetrics_OnDevice',
      'imageGenerationOverviewDailyABV1'
    ]
  },
  {
    category: 'HomeKit',
    icon: '🏠',
    color: '#FF9500',
    description: 'Smart home accessories, errors, and firmware updates',
    eventNames: [
      'HomeKitBulletinNotificationsV2',
      'HomeKitCrossFunctionalDailyCommonDimensions',
      'HomeKitCrossFunctionalDailyCommonDimensionsV2CoreThread',
      'HomeKitDailyAccessoryFirmwareUpdate',
      'HomeKitDailyErrorAggregationV8',
      'HomeKitAutoMigrationEligibilityStatus',
      'HomeKitAutoMigrationEligibilityStatusV2'
    ]
  },
  {
    category: 'Mail',
    icon: '📧',
    color: '#007AFF',
    description: 'Mail processing, categorization, and urgency detection',
    eventNames: [
      'MailGenericDailyV1',
      'smartRepliesEngagementsGenericDailyV2'
    ]
  },
  {
    category: 'Safari & Web',
    icon: '🧭',
    color: '#5AC8FA',
    description: 'Web browsing, translations, and traffic distribution',
    eventNames: [
      'SafariTrafficDistribution_highersampling',
      'DidVisitWebpageWithSmartContentEnabled',
      'Translation_DetectedWebpageLanguages_samplingrate',
      'numbpages_translation_available_100psample'
    ]
  },
  {
    category: 'Siri & Spotlight',
    icon: '🔮',
    color: '#AF52DE',
    description: 'Siri inference and Spotlight search telemetry',
    eventNames: [] as string[]
  },
  {
    category: 'Connectivity',
    icon: '📶',
    color: '#34C759',
    description: 'Bluetooth, Wi-Fi, and cellular connectivity',
    eventNames: [
      'BluetoothDurationView',
      'AirPodsFMNPairingV1',
      'CcSimInfo'
    ]
  },
  {
    category: 'Stability',
    icon: '⚖️',
    color: '#FF3B30',
    description: 'System stability, hang traces, and crashes',
    eventNames: [
      'StabilityHeartBeatCount4', 'StabilityHeartBeatCount5'
    ]
  },
  {
    category: 'System',
    icon: '⚙️',
    color: '#8E8E93',
    description: 'System-level processes, containers, and diagnostics',
    eventNames: [] as string[]
  },
];

function generateSummarizationEvents(): string[] {
  const prefixes = [
    'com__apple__summarization_SummarizationKit_summarization__contentPostprocessing',
    'com__apple__summarization_SummarizationKit_summarization__contentPreprocessing',
    'com__apple__summarization_SummarizationKit_summarization__modelRunCall',
  ];
  return prefixes;
}

function categorizeEventName(name: string): string {
  const prefixMap: [string, string][] = [
    ['com__apple__summarization_', 'Summarization'],
    ['com__apple__urgency_', 'Mail'],
    ['com__apple__email_', 'Mail'],
    ['com__apple__siri_', 'Siri & Spotlight'],
    ['com__apple__spotlight_', 'Siri & Spotlight'],
    ['com__apple__duetexpertd_', 'Siri & Spotlight'],
    ['com__apple__asd__', 'Siri & Spotlight'],
    ['com__apple__containermanager_', 'System'],
    ['com__apple__security__', 'Security'],
    ['com__apple__mediaanalysis_', 'Generative AI'],
    ['com__apple__intelligenceplatform_', 'Generative AI'],
    ['com__apple__hangtracer_', 'Stability'],
    ['com__apple__swift__concurrency_', 'Stability'],
    ['com__apple__UIKit_', 'System'],
    ['com__apple__TextInput_', 'System'],
    ['com__apple__Foundation_', 'System'],
    ['com__apple__parsec_', 'System'],
    ['com__apple__iconservices_', 'System'],
    ['com__apple__momentsd_', 'System'],
    ['com__apple__proactive_', 'Siri & Spotlight'],
    ['com__apple__LocalAuthentication_', 'Security'],
    ['com__apple__PersonalizedSensingService_', 'System'],
    ['com__apple__authkit_', 'System'],
    ['com__apple__CoreRoutine_', 'Security'],
    ['com__apple__CoreIDV_', 'Security'],
    ['com_apple_aud_uarp_', 'System'],
    ['coremedia__', 'System'],
  ];

  for (const [prefix, category] of prefixMap) {
    if (name.startsWith(prefix)) return category;
  }

  for (const cat of CATEGORY_DEFINITIONS) {
    if (cat.eventNames.includes(name)) return cat.category;
  }

  return 'Other';
}

function getCatDef(category: string): EventCategoryGroup | undefined {
  return CATEGORY_DEFINITIONS.find(c => c.category === category);
}

const ACTION_MAP: Record<number, string> = {
  0: 'Displayed',
  1: 'Tapped',
  2: 'Dismissed',
  3: 'Cleared',
  4: 'Snoozed',
  5: 'Expanded'
};

const JETSAM_REASON_MAP: Record<string, string> = {
  'highwater': 'Memory Pressure',
  'per-process-limit': 'Process Limit',
  'long-idle-exit': 'Idle Exit',
  'foreground-termination': 'Foreground Kill',
  'jettisoned': 'Jettisoned',
  'killed': 'Killed'
};

export function parseAnalyticsFile(content: string): ParsedAnalytics {
  const lines = content.split('\n').filter(l => l.trim().length > 0);
  let header: IPSHeader | null = null;
  let metadata: IPSMetadata | null = null;
  const events: AnalyticsEvent[] = [];
  const eventGroups = new Map<string, AnalyticsEvent[]>();
  const deviceIdSet = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    try {
      const obj = JSON.parse(lines[i]);
      if (i === 0 && obj.bug_type) {
        header = obj as IPSHeader;
      } else if (i === 1 && obj._marker === '<metadata>') {
        metadata = obj as IPSMetadata;
      } else if (obj.name && obj.message) {
        const event = obj as AnalyticsEvent;
        events.push(event);
        if (event.deviceId) deviceIdSet.add(event.deviceId);
        const existing = eventGroups.get(event.name) || [];
        existing.push(event);
        eventGroups.set(event.name, existing);
      }
    } catch (e) {
      // Skip unparseable lines
    }
  }

  // Build category summaries
  const categoryMap = new Map<string, AnalyticsEvent[]>();
  for (const event of events) {
    const cat = categorizeEventName(event.name);
    const arr = categoryMap.get(cat) || [];
    arr.push(event);
    categoryMap.set(cat, arr);
  }

  const categories: EventCategorySummary[] = Array.from(categoryMap.entries())
    .map(([name, evts]) => {
      const def = getCatDef(name);
      const uniqueTypes = new Set(evts.map(e => e.name)).size;
      return {
        name,
        icon: def?.icon || '📊',
        color: def?.color || '#8E8E93',
        description: def?.description || 'Miscellaneous analytics events',
        eventCount: evts.reduce((s, e) => s + (e.message.Count || 1), 0),
        uniqueTypes,
        events: evts
      };
    })
    .sort((a, b) => b.eventCount - a.eventCount);

  const summary = buildSummary(events, eventGroups);

  return {
    header,
    metadata,
    events,
    eventGroups,
    categories,
    summary,
    totalEvents: events.length,
    uniqueEventTypes: eventGroups.size,
    deviceIds: Array.from(deviceIdSet)
  };
}

function buildSummary(events: AnalyticsEvent[], eventGroups: Map<string, AnalyticsEvent[]>): AnalyticsSummary {
  // Notifications
  const notifEvents = eventGroups.get('NotificationPipelineStatisticsV4_noRotation') || [];
  let totalNotifications = 0, urgentNotifications = 0, nonUrgentNotifications = 0;
  const notificationActions: Record<string, number> = {};
  for (const e of notifEvents) {
    const count = e.message.Count || 0;
    totalNotifications += count;
    if (e.message.isUrgent === true) urgentNotifications += count;
    if (e.message.isUrgent === false) nonUrgentNotifications += count;
    const action = ACTION_MAP[e.message.action] || `Action ${e.message.action}`;
    notificationActions[action] = (notificationActions[action] || 0) + count;
  }

  // Jetsam
  const jetsamEvents = eventGroups.get('JetsamAggregationV4') || [];
  const jetsamProcessMap = new Map<string, { count: number; reason: string }>();
  const jetsamReasons: Record<string, number> = {};
  for (const e of jetsamEvents) {
    const count = e.message.Count || 1;
    const name = e.message.name || 'unknown';
    const reason = JETSAM_REASON_MAP[e.message.reason] || e.message.reason || 'Unknown';
    const existing = jetsamProcessMap.get(name) || { count: 0, reason };
    existing.count += count;
    jetsamProcessMap.set(name, existing);
    jetsamReasons[reason] = (jetsamReasons[reason] || 0) + count;
  }
  const jetsamTopProcesses = Array.from(jetsamProcessMap.entries())
    .map(([name, data]) => ({ name, count: data.count, reason: data.reason }))
    .sort((a, b) => b.count - a.count);
  const totalJetsamKills = jetsamTopProcesses.reduce((s, p) => s + p.count, 0);

  // Battery / Power states
  const rawDevEvents = eventGroups.get('RawDeviceStateHistogram') || [];
  const batteryStates = rawDevEvents.map(e => ({
    state: `${e.message.charging ? '⚡' : '🔋'} ${e.message.screenOn ? 'Screen On' : 'Screen Off'} ${e.message.awake ? 'Awake' : 'Sleep'}`,
    count: e.message.Count || 0,
    energy: e.message.sum_of_energy || 0,
    duration: e.message.sum_of_duration || 0
  }));

  // Summarization
  const summEvents = eventGroups.get('SummarizationPipelineStatisticsV13_noRotation') || [];
  let summarizationTotal = 0, summarizationErrors = 0;
  const summarizationExitReasons: Record<string, number> = {};
  for (const e of summEvents) {
    const count = e.message.Count || 1;
    summarizationTotal += count;
    if (e.message.summarizationError) summarizationErrors += count;
    const reason = e.message.exitReason !== null ? String(e.message.exitReason) : 'completed';
    summarizationExitReasons[reason] = (summarizationExitReasons[reason] || 0) + count;
  }

  // Security
  const secVisits = eventGroups.get('TaSuspiciousVisits1') || [];
  const secGeneral = eventGroups.get('TaSuspiciousGeneral1') || [];
  const secOther = eventGroups.get('TaSuspiciousOther1') || [];

  // Generative AI
  const genAIPrefixes = ['GenerativeExperiences_', 'ModelManager_', 'SpeculativeDecoding', 'imageGeneration'];
  const genAIEvents = events.filter(e => genAIPrefixes.some(p => e.name.startsWith(p)));

  // HomeKit
  const hkEvents = eventGroups.get('HomeKitDailyErrorAggregationV8') || [];
  const hkNotifs = eventGroups.get('HomeKitBulletinNotificationsV2') || [];

  // Mail
  const mailPrefixes = ['com__apple__email_', 'com__apple__urgency_', 'MailGeneric'];
  const mailEvents = events.filter(e => mailPrefixes.some(p => e.name.startsWith(p)));

  // Safari
  const safariPrefixes = ['SafariTraffic', 'DidVisitWebpage', 'Translation_', 'numbpages'];
  const safariEvts = events.filter(e => safariPrefixes.some(p => e.name.startsWith(p)));

  // Stability
  const stabEvents = [...(eventGroups.get('StabilityHeartBeatCount4') || []), ...(eventGroups.get('StabilityHeartBeatCount5') || [])];

  // Top categories from metadata handled in component

  return {
    totalNotifications,
    urgentNotifications,
    nonUrgentNotifications,
    notificationActions,
    totalJetsamKills,
    jetsamTopProcesses: jetsamTopProcesses.slice(0, 20),
    jetsamReasons,
    batteryStates,
    lpmStatus: (eventGroups.get('LPMStatus') || []).map(e => e.message),
    summarizationTotal,
    summarizationErrors,
    summarizationExitReasons,
    securitySuspiciousVisits: secVisits.reduce((s, e) => s + (e.message.Count || 0), 0),
    securitySuspiciousGeneral: secGeneral.reduce((s, e) => s + (e.message.Count || 0), 0),
    securitySuspiciousOther: secOther.reduce((s, e) => s + (e.message.Count || 0), 0),
    generativeAIEvents: genAIEvents.length,
    homeKitErrors: hkEvents.reduce((s, e) => s + (e.message.Count || 0), 0),
    homeKitNotifications: hkNotifs.reduce((s, e) => s + (e.message.Count || 0), 0),
    mailEvents: mailEvents.length,
    safariEvents: safariEvts.length,
    stabilityHeartbeats: stabEvents.reduce((s, e) => s + (e.message.Count || 0), 0),
    topCategories: []
  };
}

export function formatBytes(gb: number): string {
  return `${gb} GB`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function getEventDisplayName(name: string): string {
  return name
    .replace(/^com__apple__/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();
}
