# Google OAuth Setup Guide for Broccoli App

This guide will help you set up the necessary OAuth credentials for your Broccoli app.

## Prerequisites

- Google Cloud Console account
- Firebase project (should be already set up)
- Your SHA-1 fingerprint for Android: `56:9D:33:0C:B2:E1:D2:4A:3B:8B:7B:71:1D:21:14:1C:33:53:ED:49`
- Your app's bundle ID: `com.sixfortylabs.broccoli`

## Step 1: Set up OAuth Consent Screen

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to "APIs & Services" > "OAuth consent screen"
4. Choose "External" user type (unless you have a Google Workspace)
5. Fill in the required information:
   - App name: Broccoli
   - User support email: Your email
   - Developer contact information: Your email
6. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
7. Add test users if you're in testing mode
8. Save and continue

## Step 2: Create OAuth Credentials

### Web Client ID (also used for Firebase)

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name: "Broccoli Web Client"
5. Add authorized JavaScript origins:
   - `https://broccoli-app.firebaseapp.com` (replace with your Firebase domain)
6. Add authorized redirect URIs:
   - `https://broccoli-app.firebaseapp.com/__/auth/handler` (replace with your Firebase domain)
7. Click "Create"
8. Copy the client ID to your `.env` file as `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

### Expo Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Name: "Broccoli Expo Client"
5. Add authorized redirect URIs:
   - `exp://sszqfz0-austincotter-9091.exp.direct/--/google-auth`
   - If you're using EAS, also add: `https://auth.expo.io/@austincotter/Broccoli`
6. Click "Create"
7. Copy the client ID to your `.env` file as `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID`

### Android Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Android"
4. Name: "Broccoli Android Client"
5. Package name: `com.sixfortylabs.broccoli`
6. SHA-1 certificate fingerprint: `56:9D:33:0C:B2:E1:D2:4A:3B:8B:7B:71:1D:21:14:1C:33:53:ED:49`
7. Click "Create"
8. Copy the client ID to your `.env` file as `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`

### iOS Client ID

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "iOS"
4. Name: "Broccoli iOS Client"
5. Bundle ID: `com.sixfortylabs.broccoli`
6. Click "Create"
7. Copy the client ID to your `.env` file as `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
8. Also update the `reservedClientId` in your `app.json` file with this same value (in the format `com.googleusercontent.apps.YOUR_CLIENT_ID`)

## Step 3: Update Your App Configuration

1. Update your `.env` file with all the client IDs
2. Update the `reservedClientId` in `app.json` with your iOS client ID
3. Restart your Expo development server

## Troubleshooting

If you see an error like `Error 400:invalid_request` with `redirect_uri=exp://...`, it means the redirect URI is not authorized in your Google Cloud Console. Make sure to add the exact Expo development URL to your Expo Client ID's authorized redirect URIs.

For development, your redirect URI should match the URL shown in the error message, typically in the format: `exp://sszqfz0-austincotter-9091.exp.direct/--/google-auth` 