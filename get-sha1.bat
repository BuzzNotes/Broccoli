@echo off
echo Getting SHA-1 fingerprint...
"C:\Program Files\Android\jdk\jdk-8.0.302.8-hotspot\jdk8u302-b08\bin\keytool.exe" -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android > keystore-info.txt
echo SHA-1 fingerprint saved to keystore-info.txt
pause 