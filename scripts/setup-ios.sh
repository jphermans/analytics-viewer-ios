#!/bin/bash
set -e

echo "🔧 Analytics Viewer — iOS Setup"
echo "================================"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v pod >/dev/null 2>&1 || { echo "❌ CocoaPods is required (gem install cocoapods)"; exit 1; }

# Install npm dependencies
echo "📦 Installing npm dependencies..."
npm install

# Build web app
echo "🏗️  Building web app..."
npm run build

# Add iOS platform
echo "📱 Adding iOS platform..."
if [ -d "ios" ]; then
    echo "   Removing existing ios/ directory..."
    rm -rf ios
fi
npx cap add ios

# Apply native patches
echo "🩹 Applying native patches..."

# Copy custom AppDelegate.swift
cp native-patches/AppDelegate.swift ios/App/App/AppDelegate.swift
echo "   ✓ AppDelegate.swift patched (file handling for Share Sheet / Open In)"

# Merge Info.plist entries using Python
python3 << 'PYEOF'
import plistlib

# Read generated plist
with open('ios/App/App/Info.plist', 'rb') as f:
    plist = plistlib.load(f)

# Read our custom plist
with open('native-patches/Info.plist', 'rb') as f:
    custom = plistlib.load(f)

# Add document type associations
if 'CFBundleDocumentTypes' in custom:
    plist['CFBundleDocumentTypes'] = custom['CFBundleDocumentTypes']

# Add UTType declarations
if 'UTImportedTypeDeclarations' in custom:
    plist['UTImportedTypeDeclarations'] = custom['UTImportedTypeDeclarations']

# Add App Transport Security
if 'NSAppTransportSecurity' in custom:
    plist['NSAppTransportSecurity'] = custom['NSAppTransportSecurity']

# Write merged plist
with open('ios/App/App/Info.plist', 'wb') as f:
    plistlib.dump(plist, f)

print("   ✓ Info.plist patched (document types for .ips files)")
PYEOF

# Copy Launch Screen storyboard
cp native-patches/LaunchScreen.storyboard ios/App/App/Base.lproj/LaunchScreen.storyboard
echo "   ✓ LaunchScreen.storyboard patched (branded launch screen)"

# Sync everything
echo "🔄 Syncing Capacitor..."
npx cap sync

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Open in Xcode:     npx cap open ios"
echo "  2. Set your Team (signing) in Xcode"
echo "  3. Set Bundle ID:     com.analyticsviewer.app"
echo "  4. Build & Run on your iPhone! 🎉"
