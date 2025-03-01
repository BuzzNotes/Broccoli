# OAuth Project Mismatch Issue

## The Problem

We've identified the root cause of your authentication issues:

**Your Google OAuth client IDs and Firebase project are from different Google Cloud projects.**

Specifically:
- Your Google OAuth client IDs are from project **1079081190424** (broccoli-452000)
- Your Firebase configuration is for project **440453285839** (broccoli-5d02e)

This mismatch causes the error:
```
Firebase: Invalid Idp Response: the Google id_token is not allowed to be used with this application. 
Its audience (OAuth 2.0 client ID) is 1079081190424-bo66njc6lellu79jdgnmeog14p3c904s.apps.googleusercontent.com, 
which is not authorized to be used in the project with project_number: 440453285839. (auth/invalid-credential).
```

## The Solution

You have two options:

### Option 1: Create new OAuth client IDs in the broccoli-5d02e project (Recommended)

1. Go to the Google Cloud Console for project **440453285839** (broccoli-5d02e)
2. Create new OAuth client IDs for web, iOS, and Android
3. Update your `.env` file with these new client IDs
4. Make sure all client IDs start with **440453285839**

We've created a template file `.env.firebase-5d02e` that you can use as a starting point.

### Option 2: Switch to using the broccoli-452000 Firebase project

If you prefer to keep using your existing OAuth client IDs:

1. Create a new Firebase project in the Google Cloud project **1079081190424** (broccoli-452000)
2. Get the Firebase configuration for this new project
3. Update your `firebase.js` file with this configuration
4. Update the redirect URI in `AuthContext.js` to use the new Firebase domain

## How to Verify the Fix

After implementing either solution:

1. Check that your OAuth client IDs and Firebase project are from the same Google Cloud project
2. Restart your Expo server with `npx expo start --clear`
3. Try signing in with Google
4. Check the console logs for any errors

## Why This Happens

Firebase and Google OAuth are both Google services, but they need to be properly linked:

- Each Firebase project is associated with a specific Google Cloud project
- OAuth client IDs are created within a Google Cloud project
- When you authenticate with Google, the ID token contains the client ID's project number
- Firebase verifies that this project number matches its own project number
- If they don't match, authentication fails with the "invalid-credential" error

For more detailed instructions, see the `FIREBASE-SETUP-GUIDE.md` file. 