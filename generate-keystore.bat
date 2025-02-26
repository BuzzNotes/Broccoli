@echo off
echo Generating debug keystore...
cd %USERPROFILE%\.android
keytool -genkey -v -keystore debug.keystore -storepass android -alias androiddebugkey -keypass android -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=Android Debug,O=Android,C=US"
echo.
echo Getting SHA-1 fingerprint...
keytool -list -v -keystore debug.keystore -alias androiddebugkey -storepass android -keypass android
pause 