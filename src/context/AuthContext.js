import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
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
  sendPasswordResetEmail
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
  const [request, response, promptAsync] = Google.useAuthRequest(
    {
      expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      useProxy: true,
      // For mobile development, we need to use the Expo proxy
      redirectUri: 'https://auth.expo.io/@austincotter/Broccoli',
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
      const { id_token } = response.params;
      console.log("Got id_token, creating credential");
      
      const credential = GoogleAuthProvider.credential(id_token);
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
        })
        .catch(error => {
          console.error('Google Sign-In Credential Error:', error);
        });
    } else if (response) {
      console.log("Google auth response not success:", response);
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      // Clear any previous user data
      await clearPreviousUserData();
      
      console.log("Starting Google sign-in process...");
      console.log("Platform:", Platform.OS);
      console.log("Using client IDs:", {
        ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        expo: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID
      });
      
      // Log the redirect URI
      console.log("Using redirect URI: https://auth.expo.io/@austincotter/Broccoli");
      
      // Check if request is ready
      if (!request) {
        console.log("Auth request is not ready yet");
        throw new Error("Authentication request is not ready. Please try again.");
      }
      
      const result = await promptAsync();
      console.log("Google sign-in result:", result);
      
      if (result.type !== 'success') {
        console.log("Google sign-in was not successful:", result.type);
        throw new Error(`Google sign-in failed: ${result.type}`);
      }
      
      // Don't navigate here - let the response handler in useEffect do it
      // router.push('/(onboarding)/good-news');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
      // Clear any previous user data
      await clearPreviousUserData();
      
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create OAuthProvider for Apple
      const provider = new OAuthProvider('apple.com');
      const oAuthCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.nonce,
      });

      // Sign in with Firebase
      const result = await signInWithCredential(auth, oAuthCredential);
      
      // Create/update user profile in Firestore
      await createUserProfile(result.user, {
        firstName: credential.fullName?.givenName || '',
        lastName: credential.fullName?.familyName || '',
        provider: 'apple',
        email: result.user.email || credential.email,
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
      console.error('Apple Sign-In Error:', error);
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
      console.error("Error in email sign in:", error);
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