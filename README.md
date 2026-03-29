# 📊 Analytics Viewer — iOS App

A professional iOS app built with **Capacitor + Vue 3 + Vite** that parses and summarizes iPhone Analytics `.ips` files.

## Features

- **📄 File Reception** — Open `.ips` files via Share Sheet or "Open In" from any app
- **📋 Overview Dashboard** — Key metrics, device info, quick summary cards
- **📁 Category Browser** — Events grouped into 13+ categories with visual breakdowns
- **🔍 Event Search** — Search through 168+ unique event types
- **🗂️ File Info** — Raw metadata viewer
- **🌙 Dark Mode** — Automatic system dark mode support
- **📱 iOS-native UI** — SF-style fonts, iOS cards, tab bar, blur headers

## Categories Analyzed

| Category | Description |
|----------|-------------|
| 🔋 Device & Power | Battery states, charging, energy metrics |
| 🔔 Notifications | Notification pipeline stats, urgency |
| 📝 Summarization | AI notification/content summarization |
| 🧠 Memory (Jetsam) | Process kills, memory pressure |
| 🛡️ Security | Suspicious activity, threat detection |
| ✨ Generative AI | On-device AI model inference |
| 🏠 HomeKit | Smart home errors, firmware updates |
| 📧 Mail | Email categorization, urgency |
| 🧭 Safari & Web | Browsing, translations |
| 🔮 Siri & Spotlight | Siri inference, search telemetry |
| 📶 Connectivity | Bluetooth, Wi-Fi, cellular |
| ⚖️ Stability | System stability, hang traces |
| ⚙️ System | System processes, diagnostics |

## Prerequisites

- **Node.js** 18+
- **Xcode** 15+ (for iOS builds)
- **CocoaPods** (installed via `gem install cocoapods`)

## Setup

```bash
# Install dependencies
npm install

# Build web app
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Sync web assets to iOS
npx cap sync

# Open in Xcode
npx cap open ios
```

## Important: Post-Setup iOS Configuration

After running `npx cap add ios`, you need to replace the generated files:

### 1. Replace `ios/App/App/AppDelegate.swift`

Copy the provided `AppDelegate.swift` which handles file opening via Share Sheet and "Open In". It reads the shared file and passes it to the web layer via base64 encoding.

### 2. Update `ios/App/App/Info.plist`

Add the `CFBundleDocumentTypes` and `UTImportedTypeDeclarations` entries to handle `.ips` files. The provided Info.plist already includes these.

### 3. In Xcode
- Set your **Team** (signing)
- Set **Bundle Identifier** to `com.analyticsviewer.app`
- Set deployment target to **iOS 15.0+**

## Development

```bash
# Run dev server
npm run dev

# Build
npm run build

# Sync to iOS after changes
npx cap sync
```

## How It Works

1. **File Parsing**: The `.ips` file is parsed line-by-line as JSON
   - Line 1: Header (OS version, timestamp, incident ID)
   - Line 2: Device metadata (carrier, storage, region, etc.)
   - Lines 3+: Analytics events with name, message, counts

2. **Event Categorization**: Each of the 168 event types is mapped to one of 13 categories based on name prefixes and known event names

3. **Summary Extraction**: Key metrics are extracted per category (notification counts, jetsam kills, battery states, security flags, etc.)

4. **Native File Handling**: The iOS `AppDelegate` intercepts file opens, reads the content as base64, and calls `window.handleFileFromNative()` in the web layer

## File Format

The `.ips.ca.synced` file format is one JSON object per line:

```json
{"bug_type":"211","timestamp":"...","os_version":"iPhone OS 26.4 (23E244)",...}
{"_marker":"<metadata>","deviceCapacity":512,"homeCarrierName":"...",...}
{"name":"EventName","message":{...},"Count":5,...}
```

## Project Structure

```
analytics-viewer-app/
├── index.html                  # Entry HTML
├── package.json                # Dependencies
├── vite.config.ts              # Vite config
├── capacitor.config.ts         # Capacitor config
├── tailwind.config.js          # Tailwind CSS
├── tsconfig.json               # TypeScript config
├── public/
│   └── icon.svg                # App icon
├── src/
│   ├── main.ts                 # App entry point
│   ├── App.vue                 # Main Vue component (all views)
│   ├── style.css               # Global styles (iOS-like)
│   └── parser/
│       └── analytics-parser.ts # Core parser (168 event types)
├── ios/
│   └── App/App/
│       ├── AppDelegate.swift    # iOS file handling
│       ├── Info.plist           # Document type associations
│       └── Base.lproj/          # Launch/Main storyboards
└── dist/                       # Built web assets
```

## License

MIT
