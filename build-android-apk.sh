#!/usr/bin/env bash
set -e

echo "================================================================"
echo "  GST Invoice Pro - Android (.APK) Builder via Capacitor"
echo "  Created by BEEMA STORE"
echo "================================================================"
echo ""

echo "Step 1: Installing Capacitor dependencies..."
npm install --save @capacitor/core @capacitor/android
npm install --save-dev @capacitor/cli

echo ""
echo "Step 2: Building Web Assets (Vite)..."
npm run build

echo ""
echo "Step 3: Initializing / Syncing Android Platform..."
if [ ! -d "android" ]; then
    npx cap add android
else
    npx cap sync android
fi

echo ""
echo "Step 4: Compiling Standalone Android APK (.apk)..."
cd android
./gradlew assembleDebug

echo ""
echo "================================================================"
echo "  BUILD COMPLETED SUCCESSFULLY!"
echo "  Your Android installable APK is located at:"
echo "  android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
echo "  Transfer this .apk file to your Android phone and install!"
echo "================================================================"
