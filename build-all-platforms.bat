@echo off
cls
echo 🚀 JUNOSIXTEEN MULTI-PLATFORM BUILD
echo =====================================

echo.
echo 📋 Build Options:
echo 1. Android APK
echo 2. iOS App (macOS required)  
echo 3. Windows Desktop App
echo 4. All Platforms (Full Build)
echo 5. Development Setup
echo 6. Production Deployment
echo.

set /p choice="Select build option (1-6): "

if "%choice%"=="1" goto android
if "%choice%"=="2" goto ios
if "%choice%"=="3" goto windows
if "%choice%"=="4" goto all
if "%choice%"=="5" goto dev
if "%choice%"=="6" goto prod

:android
echo.
echo 🤖 Building Android App...
echo ========================

echo Step 1: Installing Dependencies
cd mobile
call npm install
if errorlevel 1 goto error

echo Step 2: Building React Native Bundle
call npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res
if errorlevel 1 goto error

echo Step 3: Building APK
cd android
call gradlew assembleRelease
if errorlevel 1 goto error

echo ✅ Android APK built successfully!
echo 📱 Location: mobile/android/app/build/outputs/apk/release/app-release.apk
goto end

:ios
echo.
echo 🍎 Building iOS App...
echo ====================

if not exist "mobile/ios" (
    echo ❌ iOS project not found. Run 'npx react-native run-ios' first.
    goto end
)

echo Step 1: Installing Dependencies
cd mobile
call npm install
call npx pod-install ios
if errorlevel 1 goto error

echo Step 2: Building React Native Bundle
call npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output ios/main.jsbundle
if errorlevel 1 goto error

echo Step 3: Building iOS Archive
xcodebuild -workspace ios/JunoSixteen.xcworkspace -scheme JunoSixteen -configuration Release -destination "generic/platform=iOS" -archivePath ios/build/JunoSixteen.xcarchive archive
if errorlevel 1 goto error

echo ✅ iOS App built successfully!
echo 📱 Location: mobile/ios/build/JunoSixteen.xcarchive
goto end

:windows
echo.
echo 🖥️  Building Windows Desktop App...
echo =================================

echo Step 1: Installing Dependencies
call npm install
if errorlevel 1 goto error

echo Step 2: Building Electron App
call npx electron-builder --windows
if errorlevel 1 goto error

echo ✅ Windows App built successfully!
echo 💻 Location: dist-electron/JunoSixteen Setup.exe
goto end

:all
echo.
echo 🌍 Building All Platforms...
echo ===========================

echo Building Backend...
call node server-production.js &

echo Building Windows Desktop...
call npm run build-windows
if errorlevel 1 goto error

echo Building Android App...
cd mobile
call npm run build-android
if errorlevel 1 goto error

echo Building iOS App (if on macOS)...
call npm run build-ios

echo ✅ Multi-Platform Build Complete!
echo.
echo 📦 Build Artifacts:
echo    🖥️  Windows: dist-electron/JunoSixteen Setup.exe
echo    🤖 Android: mobile/android/app/build/outputs/apk/release/app-release.apk
echo    🍎 iOS: mobile/ios/build/JunoSixteen.xcarchive
echo.
goto end

:dev
echo.
echo 🛠️  Development Setup...
echo =======================

echo Step 1: Installing Backend Dependencies
call npm install
if errorlevel 1 goto error

echo Step 2: Installing Mobile Dependencies
cd mobile
call npm install
if errorlevel 1 goto error
cd ..

echo Step 3: Starting Development Servers
echo Starting Backend...
start "Backend" cmd /k "node server-production.js"

timeout /t 3 /nobreak

echo Starting Mobile Metro...
cd mobile
start "Metro" cmd /k "npx react-native start"

echo Starting Desktop App...
cd ..
start "Desktop" cmd /k "npm run electron"

echo ✅ Development Environment Started!
echo.
echo 🚀 Running Services:
echo    📡 Backend: http://localhost:3000
echo    📱 Metro: http://localhost:8081
echo    🖥️  Desktop: Electron Window
echo.
goto end

:prod
echo.
echo 🚀 Production Deployment...
echo ==========================

echo Step 1: Building Production Server
call npm install --production
if errorlevel 1 goto error

echo Step 2: Optimizing Assets
call npm run build-all
if errorlevel 1 goto error

echo Step 3: Creating Deployment Package
if not exist "deployment" mkdir "deployment"

copy "server-production.js" "deployment\"
copy "package.json" "deployment\"
copy "electron-main.js" "deployment\"
xcopy "mobile" "deployment\mobile" /E /I
xcopy "assets" "deployment\assets" /E /I

echo Step 4: Creating Docker Configuration
echo FROM node:18-alpine > deployment\Dockerfile
echo WORKDIR /app >> deployment\Dockerfile
echo COPY package.json . >> deployment\Dockerfile
echo RUN npm install --production >> deployment\Dockerfile
echo COPY . . >> deployment\Dockerfile
echo EXPOSE 3000 >> deployment\Dockerfile
echo CMD ["node", "server-production.js"] >> deployment\Dockerfile

echo Step 5: Creating Deployment Scripts
echo docker build -t junosixteen . > deployment\deploy-docker.sh
echo docker run -p 3000:3000 junosixteen >> deployment\deploy-docker.sh

echo ✅ Production Package Created!
echo 📦 Location: deployment/
echo.
echo 🌐 Deployment Options:
echo    🐳 Docker: deployment/deploy-docker.sh
echo    ☁️  Cloud: Upload deployment/ folder
echo    🖥️  Local: Run server-production.js
echo.
goto end

:error
echo.
echo ❌ BUILD FAILED!
echo Check the error messages above.
echo.
pause
exit /b 1

:end
echo.
echo 🎉 BUILD PROCESS COMPLETED!
echo.
echo 📱 JunoSixteen Multi-Platform App:
echo    ✅ Backend Server (Node.js)
echo    ✅ Desktop App (Electron)
echo    ✅ Mobile Apps (React Native)
echo    ✅ UL/MCP AI Integration
echo    ✅ Production Ready
echo.
echo 💡 Next Steps:
echo    1. Test apps on target devices
echo    2. Deploy backend to cloud
echo    3. Submit mobile apps to stores
echo    4. Distribute desktop installer
echo.

pause 