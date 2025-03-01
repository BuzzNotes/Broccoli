import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { 
  GoogleAuthProvider, 
  signInWithCredential, 
  OAuthProvider,
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup
} from 'firebase/auth';
import { 
  setDoc,
  doc,
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';
import { createUserProfile, getUserProfile, isProfileComplete } from '../utils/userProfile';

// Complete any pending authentication sessions
WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext({});

// Helper function to clear previous user data from AsyncStorage
const clearPreviousUserData = async () => {
  const keysToRemove = [
    'user', 
    'userProfile', 
    'userName', 
    'userAge', 
    'userGender', 
    'userProfileImage'
  ];
  
  try {
    await AsyncStorage.multiRemove(keysToRemove);
  } catch (error) {
    console.error('Error clearing previous user data:', error);
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Auth Configuration
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
    {
      // Use the client IDs from the .env file, which are correct
      clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      // For iOS, use the iOS client ID
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      // For Android, use the Android client ID
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      // For web, use the web client ID
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      // Don't use the proxy for now as it's causing issues
      useProxy: false,
      // Use direct redirect
      redirectUri: Platform.select({
        web: 'https://broccoli-452000.firebaseapp.com/__/auth/handler',
        ios: 'com.sixfortylabs.broccoli://',
        android: 'com.sixfortylabs.broccoli://'
      }),
      // Force login prompt to avoid session issues
      prompt: 'select_account',
      scopes: ['profile', 'email'],
    }
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Get full user profile from Firestore
          const userProfile = await getUserProfile();
          
          console.log("Auth state changed - User:", user.uid);
          console.log("Auth state changed - Profile:", userProfile);
          
          // Combine auth user with profile data
          const userData = {
            ...user,
            profile: userProfile
          };
          
          setUser(userData);
          
          // Store user data in AsyncStorage
          await AsyncStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          console.error('Error fetching user profile:', error);
          setUser(user);
          await AsyncStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      console.log("Google auth response success:", response);
      
      try {
        // Check if we have an authentication object with accessToken
        if (response.authentication && response.authentication.idToken) {
          console.log("Using authentication object with ID token");
          
          // Create credential using only the ID token
          const credential = GoogleAuthProvider.credential(response.authentication.idToken);
          
          console.log("Created credential with ID token only");
          
          handleGoogleCredential(credential);
        }
        // Fallback to using id_token from params if authentication object is not available
        else if (response.params && response.params.id_token) {
          console.log("Using id_token from response params");
          
          const { id_token } = response.params;
          
          console.log("Got id_token in useEffect, creating credential");
          
          const credential = GoogleAuthProvider.credential(id_token);
          handleGoogleCredential(credential);
        } else {
          console.error("No authentication tokens found in response:", response);
        }
      } catch (error) {
        console.error("Error creating credential:", error);
      }
    } else if (response) {
      console.log("Google auth response not success:", response);
    }
  }, [response]);

  // Helper function to handle Google credential
  const handleGoogleCredential = (credential) => {
    // Set loading to true
    setLoading(true);
    
    // Try to sign in with the credential
    signInWithCredential(auth, credential)
      .then(async result => {
        console.log("Successfully signed in with credential");
        // Extract name from Google profile
        const user = result.user;
        const displayName = user.displayName || '';
        const nameParts = displayName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        
        // Create/update user profile in Firestore
        await createUserProfile(user, { 
          firstName, 
          lastName,
          provider: 'google'
        });

        // Check if profile is complete
        const userProfile = await getUserProfile();
        const { isComplete } = isProfileComplete(userProfile);

        // Route based on profile completeness
        if (!isComplete) {
          router.push('/(auth)/complete-profile');
        } else {
          router.push('/(onboarding)/good-news');
        }
        
        // Keep loading true during navigation
        // The loading state will be reset by the onAuthStateChanged listener
      })
      .catch(error => {
        console.error('Google Sign-In Credential Error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // Reset loading state on error
        setLoading(false);
        
        // If the API key is invalid, try a different approach
        if (error.code === 'auth/api-key-not-valid.-please-pass-a-valid-api-key.') {
          console.log("API key issue detected, trying alternative approach...");
          // Here we would implement an alternative approach if needed
        }
      });
  };

  const signInWithGoogle = async () => {
    try {
      // Set loading to true
      setLoading(true);
      
      // Clear any previous user data
      await clearPreviousUserData();
      
      console.log("Starting Google sign-in process...");
      console.log("Platform:", Platform.OS);
      
      // Check if we're running in a web browser
      const isWeb = Platform.OS === 'web';
      console.log("Is web platform:", isWeb);
      
      if (isWeb) {
        // For web browsers, use Firebase's built-in Google provider
        console.log("Using web-specific authentication approach");
        
        const provider = new GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        
        // Force the provider to show the account selection prompt
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        try {
          // Sign in with popup (works better in browsers than the redirect method)
          const result = await signInWithPopup(auth, provider);
          console.log("Firebase Google sign-in result:", result);
          
          // Extract user info
          const user = result.user;
          const displayName = user.displayName || '';
          const nameParts = displayName.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
          
          // Create/update user profile in Firestore
          await createUserProfile(user, { 
            firstName, 
            lastName,
            provider: 'google'
          });
          
          // Check if profile is complete
          const userProfile = await getUserProfile();
          const { isComplete } = isProfileComplete(userProfile);
          
          // Route based on profile completeness
          if (!isComplete) {
            router.push('/(auth)/complete-profile');
          } else {
            router.push('/(onboarding)/good-news');
          }
        } catch (error) {
          console.error("Error with Firebase Google sign-in:", error);
          throw error;
        }
      } else {
        // For mobile, use direct authentication
        console.log("Using direct authentication for mobile");
        
        // Check if request is ready
        if (!request) {
          console.log("Auth request is not ready yet");
          throw new Error("Authentication request is not ready. Please try again.");
        }
        
        console.log("Starting Google sign-in with direct authentication...");
        console.log("Platform:", Platform.OS);
        console.log("Using client ID:", Platform.OS === 'ios' ? 
          process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID : 
          process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID);
        
        // Use direct authentication - this will trigger the useEffect with response
        const result = await promptAsync();
        console.log("Google sign-in result:", result);
        
        if (result.type !== 'success') {
          console.log("Google sign-in was not successful:", result.type);
          throw new Error(`Google sign-in failed: ${result.type}`);
        }
        
        // For mobile, we don't handle the credential here anymore
        // The useEffect hook will handle it when the response comes back
        console.log("Authentication initiated successfully. Waiting for response...");
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      // Set loading to true
      setLoading(true);
      
      // Clear any previous user data
      await clearPreviousUserData();
      
      console.log("Starting Apple sign-in process...");
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log("Apple authentication successful");
      console.log("Apple credential received:", JSON.stringify({
        fullName: credential.fullName,
        email: credential.email,
        hasIdentityToken: !!credential.identityToken
      }));

      // Create OAuthProvider for Apple
      const provider = new OAuthProvider('apple.com');
      const oAuthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.nonce,
      });

      // Sign in with Firebase
      const result = await signInWithCredential(auth, oAuthCredential);
      console.log("Firebase sign-in successful with Apple credential");
      
      // Important: Apple only provides the name during the FIRST sign-in
      // For subsequent sign-ins, we need to check if we already have the name
      // and only update it if Apple provided it this time
      
      // First, check if Apple provided a name in this sign-in
      const hasAppleProvidedName = credential.fullName && 
        (credential.fullName.givenName || credential.fullName.familyName);
      
      console.log("Has Apple provided name in this sign-in?", hasAppleProvidedName);
      
      if (hasAppleProvidedName) {
        console.log("Apple provided name:", 
          credential.fullName.givenName, 
          credential.fullName.familyName);
          
        // Create/update user profile with the name Apple provided
        await createUserProfile(result.user, {
          firstName: credential.fullName?.givenName || '',
          lastName: credential.fullName?.familyName || '',
          provider: 'apple',
          email: result.user.email || credential.email,
        });
      } else {
        console.log("Apple did not provide name in this sign-in (expected for repeat sign-ins)");
        
        // Get existing profile to see if we already have a name
        const existingProfile = await getUserProfile();
        console.log("Existing profile:", JSON.stringify(existingProfile));
        
        if (existingProfile && (existingProfile.firstName || existingProfile.lastName)) {
          console.log("Using existing name from profile");
          
          // Just update login time and provider info, preserving existing name
          await createUserProfile(result.user, {
            provider: 'apple',
            email: result.user.email || credential.email,
            // Don't provide firstName/lastName to preserve existing values
          });
        } else {
          console.log("No existing name found and Apple didn't provide one");
          console.log("Using email or display name as fallback");
          
          // No existing name and Apple didn't provide one
          // Use email or display name as fallback
          await createUserProfile(result.user, {
            provider: 'apple',
            email: result.user.email || credential.email,
            // Let createUserProfile extract name from email or display name
          });
        }
      }

      // Check if profile is complete
      const userProfile = await getUserProfile();
      console.log("Final user profile after Apple sign-in:", JSON.stringify(userProfile));
      const { isComplete } = isProfileComplete(userProfile);

      // Route based on profile completeness
      if (!isComplete) {
        router.push('/(auth)/complete-profile');
      } else {
        router.push('/(onboarding)/good-news');
      }
      
      // Keep loading true during navigation
      // The loading state will be reset by the onAuthStateChanged listener
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      // Reset loading state on error
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      
      // Clear all user-related data from AsyncStorage
      const keysToRemove = [
        'user', 
        'userProfile', 
        'userName', 
        'userAge', 
        'userGender', 
        'userProfileImage'
      ];
      await AsyncStorage.multiRemove(keysToRemove);
      
      setUser(null);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  };

  // Add email sign-in function
  const emailSignIn = async ({ email, password }) => {
    try {
      // Set loading to true
      setLoading(true);
      
      // Clear any previous user data
      await clearPreviousUserData();
      
      // Sign in with email and password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Get the user profile from Firestore
      let userProfile = await getUserProfile();
      
      // If the profile is empty (doesn't exist in Firestore), create one
      if (!userProfile || Object.keys(userProfile).length === 0) {
        console.log("Creating new user profile for email sign-in user");
        
        // Extract email username as a fallback name
        const emailUsername = email.split('@')[0];
        const formattedUsername = emailUsername
          .split(/[._-]/)
          .map(part => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ');
        
        // Create a basic profile
        await createUserProfile(userCredential.user, {
          firstName: formattedUsername,
          email: email,
          provider: 'email',
        });
        
        // Get the newly created profile
        userProfile = await getUserProfile();
      }
      
      // Update the user state with profile data
      const userData = {
        ...userCredential.user,
        profile: userProfile
      };
      
      // Update the user state
      setUser(userData);
      
      // Check if profile is complete
      const { isComplete } = isProfileComplete(userProfile);
      
      // Route based on profile completeness
      if (!isComplete) {
        router.push('/(auth)/complete-profile');
      } else {
        router.push('/(onboarding)/good-news');
      }
      
      // Keep loading true during navigation
      // The loading state will be reset by the onAuthStateChanged listener
    } catch (error) {
      console.error('Email Sign-In Error:', error);
      // Reset loading state on error
      setLoading(false);
      throw error;
    }
  };

  // Add password reset function
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error in password reset:", error);
      throw error;
    }
  };

  async function emailSignUp({ email, password, firstName, lastName, birthdate }) {
    try {
      // Clear any previous user data
      await clearPreviousUserData();
      
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create/update user profile in Firestore
      await createUserProfile(userCredential.user, {
        firstName,
        lastName,
        email,
        birthdate,
        provider: 'email',
      });

      // Get the user profile from Firestore
      const userProfile = await getUserProfile();
      
      // Update the user state with profile data
      const userData = {
        ...userCredential.user,
        profile: userProfile
      };
      
      // Update the user state
      setUser(userData);
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      
      // Check if profile is complete
      const { isComplete } = isProfileComplete(userProfile);

      // Route based on profile completeness
      if (!isComplete) {
        router.push('/(auth)/complete-profile');
      } else {
        router.push('/(onboarding)/good-news');
      }

      return userCredential.user;
    } catch (error) {
      console.error("Error in email signup:", error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    logout,
    emailSignUp,
    emailSignIn,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 