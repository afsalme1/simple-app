@echo off
echo =======================================================
echo   GST Invoice Pro - Windows (.EXE) Desktop Builder
echo =======================================================
echo.
echo Step 1: Installing dependencies...
call npm install
call npm install --save-dev electron electron-builder

echo.
echo Step 2: Building Web Application...
call npm run build

echo.
echo Step 3: Packaging into Windows Standalone .EXE Installer...
call npx electron-builder --win nsis -c.extraMetadata.main=electron-main.cjs

echo.
echo =======================================================
echo   BUILD COMPLETE!
echo   Your Windows installer is located in: dist-electron/
echo   File: GST Invoice Pro Setup.exe
echo =======================================================
pause
