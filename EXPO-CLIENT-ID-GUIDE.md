# Creating an Expo Client ID for Google OAuth

The error message you're seeing (`Error 400:invalid_request` with `redirect_uri=exp://sszqfz0-austincotter-9091.exp.direct`) indicates that you need to create a specific OAuth client ID for your Expo development environment.

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

## After Creating the Expo Client ID

1. Update your `.env` file with the new client ID
2. Restart your Expo development server completely
3. Try the Google sign-in again 