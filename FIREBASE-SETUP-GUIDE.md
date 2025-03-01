# Firebase Setup Guide for Broccoli App

This guide will help you set up Firebase for the Broccoli app, ensuring all authentication methods work correctly.

## Project Information
- **Firebase Project ID**: broccoli-452000
- **Google Cloud Project Number**: 1079081190424

## Step 1: Register a Web App in Firebase

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select the project "broccoli-452000"
3. In Project Overview, click on the web icon (</>) to add a web app if not already added
4. Register the app with a nickname (e.g., "Broccoli Web")
5. Copy the Firebase configuration object that looks like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCC1RNORXgRcT82vA8cQ6axBW047w3BBDA",
  authDomain: "broccoli-452000.firebaseapp.com",
  projectId: "broccoli-452000",
  storageBucket: "broccoli-452000.appspot.com",
  messagingSenderId: "1079081190424",
  appId: "1:1079081190424:web:9fee6afd2bdee2dd762f6d",
  measurementId: "G-DKPEER8WNF"
};
```

## Step 2: Verify OAuth Client IDs

Ensure your OAuth client IDs are from the correct Google Cloud project (1079081190424):

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Make sure you're in the project associated with broccoli-452000 (project number: 1079081190424)
3. Navigate to "APIs & Services" > "Credentials"
4. Verify you have OAuth client IDs for:
   - Web application
   - iOS
   - Android

These client IDs should be in your `.env` file:
```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1079081190424-xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=1079081190424-xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=1079081190424-xxxxxxxx.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=1079081190424-xxxxxxxx.apps.googleusercontent.com
```

## Step 3: Enable Authentication Methods

1. In the Firebase Console, go to "Authentication" > "Sign-in method"
2. Enable the following authentication methods:
   - **Google**: Enter your Web Client ID and enable it
   - **Email/Password**: Simply enable this option
   - **Apple**: Follow the setup instructions to configure your Apple Developer account
   - Any other methods you need (Facebook, Twitter, etc.)

### Apple Sign-In Setup
1. You'll need an Apple Developer account
2. Create a Service ID in the Apple Developer Console
3. Configure the domain and return URL in your Apple Developer account
4. Generate a private key and upload it to Firebase

## Step 4: Update Authorized Domains

1. In Firebase Authentication settings, go to the "Authorized domains" section
2. Add your app's domains (e.g., `broccoli-452000.firebaseapp.com` and any custom domains)

## Step 5: Verify Redirect URIs

Ensure your redirect URIs are correctly set in:

1. **AuthContext.js file**:
```javascript
redirectUri: Platform.select({
  web: 'https://broccoli-452000.firebaseapp.com/__/auth/handler',
  ios: 'com.sixfortylabs.broccoli://',
  android: 'com.sixfortylabs.broccoli://'
}),
```

2. **Google Cloud Console**:
   - For the Web client ID, add `https://broccoli-452000.firebaseapp.com/__/auth/handler` as an authorized redirect URI

## Step 6: Test Your Configuration

1. Restart your Expo server: `cd Broccoli && npx expo start --clear`
2. Test signing in with Google, Apple, and Email/Password
3. Verify that user data is being saved to the Firebase database

## Troubleshooting

If you encounter authentication errors:
- Verify that all configuration values match between Firebase and your app
- Check that OAuth client IDs are from the correct project (1079081190424)
- Ensure all necessary APIs are enabled in the Google Cloud Console
- Verify that redirect URIs are correctly set up

## Additional Resources

- [Firebase Authentication Documentation](https://firebase.google.com/docs/auth)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- [Apple Sign-In with Firebase](https://firebase.google.com/docs/auth/web/apple) 