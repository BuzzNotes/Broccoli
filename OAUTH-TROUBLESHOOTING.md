# OAuth Troubleshooting Guide

This guide helps troubleshoot common OAuth issues with Google authentication in Expo/React Native apps.

## Common Error: redirect_uri_mismatch

If you're seeing "Error 400: redirect_uri_mismatch", it means the redirect URI in your authentication request doesn't match what's authorized in your Google Cloud Console.

### Solution:

1. **Check your Google Cloud Console configuration**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Navigate to "APIs & Services" > "Credentials"
   - Find your Web Client ID
   - Make sure `https://auth.expo.io/@austincotter/Broccoli` is listed as an authorized redirect URI
   - There should be no trailing slashes or case differences

2. **Check your code**:
   - Make sure you're using the web client ID when using the Expo proxy
   - Ensure `useProxy: true` is set in your configuration
   - Explicitly set the redirect URI to match what's in Google Cloud Console

3. **Force the correct client ID**:
   ```javascript
   const result = await promptAsync({
     clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
     redirectUri: 'https://auth.expo.io/@austincotter/Broccoli',
     useProxy: true
   });
   ```

## Client ID Confusion

When using Expo's authentication proxy, you must use the web client ID, not the iOS or Android client IDs.

### Solution:

1. **Update your AuthContext.js**:
   ```javascript
   const [request, response, promptAsync] = Google.useAuthRequest({
     clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Force web client ID
     expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
     useProxy: true,
     redirectUri: 'https://auth.expo.io/@austincotter/Broccoli',
     scopes: ['profile', 'email'],
   });
   ```

2. **Check your .env file**:
   - Make sure your web client ID is correct
   - For Expo development with proxy, use the web client ID as the Expo client ID

## Firebase Integration Issues

When using Firebase with Expo, there are specific configurations needed:

1. **In Google Cloud Console**:
   - Make sure your web client ID has the Expo proxy redirect URI:
     - `https://auth.expo.io/@austincotter/Broccoli`
   - For web applications, also add:
     - `https://broccoli-app.firebaseapp.com/__/auth/handler`

2. **In your code**:
   - Use the web client ID for authentication
   - Use the Expo proxy redirect URI in both the Google.useAuthRequest configuration and the promptAsync call
   - Make sure Firebase is properly initialized

## Testing vs. Production

If your app is in testing mode, only authorized test users can sign in. To allow all users:

1. Go to Google Cloud Console > "APIs & Services" > "OAuth consent screen"
2. Scroll to "Publishing status" and click "Publish App"
3. Follow the prompts to complete the process

## Debugging Tips

1. **Add detailed logging**:
   ```javascript
   console.log("Request object:", request);
   console.log("Using client ID:", process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID);
   console.log("Using redirect URI:", 'https://auth.expo.io/@austincotter/Broccoli');
   ```

2. **Clear cache and restart**:
   ```
   npx expo start --clear
   ```

3. **Check the actual request URL**:
   - Look at the `url` property in the request object
   - Verify it's using the correct client ID and redirect URI
   - The redirect URI should be `https://auth.expo.io/@austincotter/Broccoli`

4. **Verify scopes**:
   - Make sure the scopes in your code match what's configured in Google Cloud Console 

## Verifying Your Redirect URI

To ensure your Expo redirect URI is valid and secure:

1. **Check the format**:
   - It should be `https://auth.expo.io/@yourusername/yourappslug`
   - It must use HTTPS (which the Expo proxy provides)
   - Your Expo username and app slug must match your Expo account and app.json

2. **Verify in Google Cloud Console**:
   - Go to "APIs & Services" > "Credentials"
   - Find your Web Client ID
   - Make sure the exact URI is listed under authorized redirect URIs

3. **Test the URI**:
   - You can't directly visit the URI in a browser (it's meant for OAuth redirects)
   - But you can check if your Expo account exists by visiting `https://expo.io/@yourusername`

4. **Update your app.json**:
   - Make sure your app.json has the correct "owner" and "slug" fields
   - These should match the username and app name in your redirect URI
   - For example:
     ```json
     {
       "expo": {
         "name": "Broccoli",
         "slug": "Broccoli"
       }
     }
     ```

## Common Error: Unable to process request due to missing initial state

If you see an error like "Unable to process request due to missing initial state. This may happen if browser sessionStorage is inaccessible or accidentally cleared", this is related to how Google OAuth manages session state.

### Solution:

1. **Add a state parameter**:
   ```javascript
   const randomState = Math.random().toString(36).substring(2, 15);
   
   const result = await promptAsync({
     // other parameters...
     extraParams: {
       state: randomState
     },
     prompt: 'login'
   });
   ```

2. **Force a login prompt**:
   - Add `prompt: 'login'` to both your Google.useAuthRequest configuration and promptAsync call
   - This forces Google to show the login screen and create a new session

3. **Clear browser cache**:
   - If testing in a web browser, try clearing your browser cache
   - For mobile, restart the Expo client app completely

4. **Check your Google Cloud Console settings**:
   - Make sure you've enabled the necessary APIs (Google Sign-In API)
   - Verify your OAuth consent screen is properly configured

5. **Try a different authentication approach**:
   - If you continue to have issues with the Expo proxy, consider using Firebase's direct authentication methods
   - For production apps, implement native Google Sign-In using the Expo Google Sign-In library 

## Browser-Specific Authentication Issues

When using Google OAuth in a web browser environment, you may encounter different issues than on mobile devices. Here's how to handle them:

### For "Unable to process request due to missing initial state" in browsers:

1. **Use Firebase's direct authentication methods**:
   ```javascript
   // Import the necessary functions
   import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
   import { auth } from '../config/firebase';
   
   // In your signInWithGoogle function
   if (Platform.OS === 'web') {
     // Create a Google provider
     const provider = new GoogleAuthProvider();
     provider.addScope('profile');
     provider.addScope('email');
     
     // Force the provider to show the account selection prompt
     provider.setCustomParameters({
       prompt: 'select_account'
     });
     
     // Sign in with popup (works better in browsers)
     const result = await signInWithPopup(auth, provider);
     
     // Handle the result...
   } else {
     // Use Expo auth session for mobile
     const result = await promptAsync({...});
   }
   ```

2. **Avoid using the Expo authentication proxy in browsers**:
   - The Expo authentication proxy works best on mobile devices
   - For web browsers, use Firebase's built-in authentication methods

3. **Clear browser cache and cookies**:
   - Try clearing your browser's cache and cookies
   - Use an incognito/private browsing window for testing

4. **Check for browser extensions**:
   - Some privacy or ad-blocking extensions can interfere with OAuth flows
   - Try disabling extensions or using a browser without extensions 