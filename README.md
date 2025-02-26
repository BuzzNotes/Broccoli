# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

## Firebase Setup

This project uses Firebase for authentication and Firestore for data storage. To set up the Firebase environment:

1. Install Firebase CLI globally (if not already installed)

   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase

   ```bash
   firebase login
   ```

3. Initialize Firebase in your project (if not already done)

   ```bash
   firebase init
   ```

4. Deploy Firestore security rules

   ```bash
   firebase deploy --only firestore:rules
   ```

## User Profile System

The app includes a user profile system that stores user information in Firebase Firestore. When users sign up or log in (via email, Google, or Apple), their profile information is stored in the `users` collection with the following structure:

```javascript
{
  uid: "user-id-from-firebase-auth",
  email: "user@example.com",
  firstName: "John",
  lastName: "Doe",
  displayName: "John Doe",
  photoURL: "https://example.com/profile.jpg", // Optional
  signUpDate: Timestamp,
  lastLogin: Timestamp,
  lastUpdated: Timestamp
}
```

The user profile system provides the following functionality:

- Automatic profile creation upon sign-up/login
- Storage of user data in Firestore with proper security rules
- Local caching for offline access
- Utilities for updating and retrieving user profiles

### User Profile Utilities

The project includes several utility functions in `src/utils/userProfile.js`:

- `createUserProfile()`: Creates a new user profile in Firestore
- `getUserProfile()`: Retrieves a user's profile data
- `updateUserProfile()`: Updates specific user profile fields
- `isProfileComplete()`: Checks if a user has completed their profile
- `getUserFullName()`: Gets a formatted full name from the profile
