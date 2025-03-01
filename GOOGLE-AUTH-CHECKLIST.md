# Google Sign-In Checklist for Expo/React Native

This checklist will help ensure your Google Sign-In is correctly configured for Expo development.

## Google Cloud Console Configuration

- [x] Create a project in Google Cloud Console
- [x] Enable the Google Sign-In API
- [x] Configure the OAuth consent screen
  - [x] Add necessary scopes (`profile` and `email`)
  - [x] Add authorized domains if applicable
  - [x] Set proper app information (name, logo, etc.)
- [x] Create OAuth credentials
  - [x] Web client ID (needed for Expo development proxy)
  - [x] iOS client ID (for native iOS builds)
  - [x] Android client ID (for native Android builds)
- [x] Add correct authorized redirect URIs:
  - [x] `https://auth.expo.io/@yourusername/yourapp` (For Expo development)
  - [x] `https://yourapp-domain.firebaseapp.com/__/auth/handler` (For Firebase)

## Environment Variables

- [x] Create a `.env` file with all client IDs:
  ```
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.apps.googleusercontent.com
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-android-client-id.apps.googleusercontent.com
  EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
  ```
- [x] For Expo development, use the web client ID as the Expo client ID

## App Configuration

- [x] Update `app.json` with correct configuration:
  ```json
  {
    "expo": {
      "ios": {
        "bundleIdentifier": "com.yourcompany.yourapp",
        "config": {
          "googleSignIn": {
            "reservedClientId": "com.googleusercontent.apps.your-ios-client-id"
          }
        }
      },
      "android": {
        "package": "com.yourcompany.yourapp"
      },
      "scheme": "yourapp",
      "owner": "yourusername"
    }
  }
  ```
- [x] Ensure the `owner` field matches your Expo username
- [x] Ensure the `slug` field matches your app name

## Code Implementation

- [x] Install necessary packages:
  ```bash
  npm install expo-auth-session @react-native-async-storage/async-storage firebase
  ```
- [x] Import required modules:
  ```javascript
  import * as Google from 'expo-auth-session/providers/google';
  import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
  ```
- [x] Configure Google Auth:
  ```javascript
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    useProxy: true,
    redirectUri: 'https://auth.expo.io/@yourusername/yourapp',
    prompt: 'login',
    scopes: ['profile', 'email'],
  });
  ```
- [x] Handle the response:
  ```javascript
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(result => {
          // Handle successful sign-in
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
  }, [response]);
  ```
- [x] Implement sign-in function:
  ```javascript
  const signInWithGoogle = async () => {
    try {
      const result = await promptAsync({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        redirectUri: 'https://auth.expo.io/@yourusername/yourapp',
        useProxy: true,
        prompt: 'login',
        scopes: ['profile', 'email']
      });
      
      if (result.type !== 'success') {
        throw new Error(`Google sign-in failed: ${result.type}`);
      }
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  };
  ```

## Platform-Specific Considerations

### Web
- [x] For web, use Firebase's built-in Google provider:
  ```javascript
  if (Platform.OS === 'web') {
    const provider = new GoogleAuthProvider();
    provider.addScope('profile');
    provider.addScope('email');
    const result = await signInWithPopup(auth, provider);
    // Handle result
  }
  ```

### iOS
- [x] Configure `app.json` with `reservedClientId`
- [x] Add `usesAppleSignIn: true` if you also use Apple Sign-In

### Android
- [x] Add SHA-1 fingerprint to Android client ID in Google Cloud Console
- [x] Configure `app.json` with correct package name

## Common Issues and Solutions

### "redirect_uri_mismatch" Error
- [x] Ensure the redirect URI in your code exactly matches what's in Google Cloud Console
- [x] Check for typos, missing characters, or case differences
- [x] For Expo, ensure the URI is `https://auth.expo.io/@yourusername/yourapp`

### "Invalid client ID" Error
- [x] Double-check all client IDs in your `.env` file
- [x] Ensure you're using the web client ID for Expo development with proxy

### "missing initial state" Error
- [x] Add a random state parameter to your promptAsync call
- [x] Use `prompt: 'login'` to force a new session
- [x] Clear browser cache and cookies

## Testing and Debugging

- [x] Add detailed logging:
  ```javascript
  console.log("Platform:", Platform.OS);
  console.log("Using client ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  console.log("Using redirect URI:", 'https://auth.expo.io/@yourusername/yourapp');
  ```
- [x] Restart Expo completely after changes: `npx expo start --clear`
- [x] On mobile, force close and reopen the Expo Go app
- [x] Try testing on different platforms (iOS, Android, web)
- [x] Check Firebase logs for authentication errors 