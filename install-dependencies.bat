@echo off
cls
echo 🚀 JunoSixteen Production Setup
echo ================================

echo.
echo ⚙️  Installing Backend Dependencies...
call npm install

echo.
echo 🔧 Installing Additional Required Packages...
call npm install mongoose bcryptjs

echo.
echo 🤖 Installing AI Dependencies...
call npm install @google/generative-ai google-auth-library

echo.
echo 📱 Installing React Native CLI...
call npm install -g react-native-cli
call npm install -g @react-native-community/cli

echo.
echo 🖥️  Installing Electron for Windows Desktop...
call npm install -g electron
call npm install electron-builder --save-dev

echo.
echo ✅ All dependencies installed!
echo.
echo 📋 Next Steps:
echo 1. Configure Firebase credentials
echo 2. Start backend: npm start
echo 3. Build mobile apps: npm run build-mobile
echo 4. Build Windows app: npm run build-windows
echo.

pause 