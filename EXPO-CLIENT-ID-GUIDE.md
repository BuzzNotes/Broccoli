# Creating an Expo Client ID for Google OAuth

The error message you're seeing (`Error 400:invalid_request` with `redirect_uri=exp://sszqfz0-austincotter-9091.exp.direct`) indicates that Google is rejecting the Expo development URL because it doesn't end with a standard top-level domain.

## Solution: Use Expo's Authentication Proxy

Instead of trying to authorize the Expo development URL directly in Google Cloud Console (which Google rejects), we can use Expo's authentication proxy service.

1. Update your `AuthContext.js` file to include the `useProxy: true` option:
   ```javascript
   const [request, response, promptAsync] = Google.useAuthRequest({
     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
     androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
     expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
     useProxy: true,  // This enables Expo's authentication proxy
   });
   ```

2. Make sure your `.env` file has the `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID` set to your web client ID:
   ```
   EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_web_client_id_here
   ```

3. In your Google Cloud Console:
   - Make sure your web client ID has `https://auth.expo.io/@austincotter/Broccoli` as an authorized redirect URI
   - This allows the Expo proxy to handle the authentication flow

## How the Proxy Works

1. Instead of redirecting directly to your Expo app, Google will redirect to Expo's authentication server
2. Expo's server will then redirect back to your app with the authentication result
3. This avoids the issue with Google rejecting non-standard top-level domains

## After Setting Up the Proxy

1. Restart your Expo development server completely
2. Try the Google sign-in again

If you still encounter issues, check that:
1. Your web client ID is correct in the `.env` file
2. The `useProxy: true` option is set in `AuthContext.js`
3. The redirect URI `https://auth.expo.io/@austincotter/Broccoli` is authorized in Google Cloud Console

## Steps to Create an Expo Client ID

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Select "Web application" (yes, Web application - even though this is for Expo)
6. Name: "Broccoli Expo Development"
7. Under "Authorized redirect URIs", add:
   - `exp://sszqfz0-austincotter-9091.exp.direct/--/google-auth`
   - This should match exactly the redirect URI from your error message
8. Click "Create"
9. Copy the generated client ID
10. Update your `.env` file:
    ```
    EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_new_client_id_here
    ```

## Important Notes

- The Expo client ID is different from your iOS and Android client IDs
- It must be created as a "Web application" type in Google Cloud Console
- The redirect URI must match exactly what appears in your error message
- If your Expo development URL changes (which can happen when restarting Expo), you may need to add the new URL as another authorized redirect URI

## Temporary Workaround

Until you create a specific Expo client ID, we've set your `.env` file to use your iOS client ID as a fallback. This might work in some cases but is not guaranteed. 