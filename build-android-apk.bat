@echo off
echo ================================================================
echo   GST Invoice Pro - Android (.APK) Builder via Capacitor
echo   Created by BEEMA STORE
echo ================================================================
echo.

echo Step 1: Checking and Installing Capacitor dependencies...
call npm install --save @capacitor/core @capacitor/android
call npm install --save-dev @capacitor/cli

echo.
echo Step 2: Building Web Assets (Vite)...
call npm run build

echo.
echo Step 3: Initializing Android Platform...
if not exist "android" (
    call npx cap add android
) else (
    call npx cap sync android
)

echo.
echo Step 4: Compiling Standalone Android APK (.apk)...
cd android
call gradlew assembleDebug

echo.
echo ================================================================
echo   BUILD COMPLETED SUCCESSFULLY!
echo   Your Android installable APK is located at:
echo   android\app\build\outputs\apk\debug\app-debug.apk
echo.
echo   Transfer this .apk file to your Android phone and tap to install!
echo ================================================================
cd ..
pause
