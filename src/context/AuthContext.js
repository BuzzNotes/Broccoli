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
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { 
  setDoc,
  doc 
} from 'firebase/firestore';
import { auth } from '../config/firebase';
import { db } from '../config/firebase';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Auth Configuration
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: 'your-ios-client-id',
    androidClientId: 'your-android-client-id',
    webClientId: 'your-web-client-id',
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      if (user) {
        // Store user data in AsyncStorage
        AsyncStorage.setItem('user', JSON.stringify(user));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential);
    }
  }, [response]);

  const signInWithGoogle = async () => {
    try {
      await promptAsync();
      router.push('/(onboarding)/good-news');
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    try {
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
      await signInWithCredential(auth, oAuthCredential);
      router.push('/(onboarding)/good-news');
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout Error:', error);
      throw error;
    }
  };

  async function emailSignUp({ email, password, firstName, lastName, birthdate }) {
    try {
      // Create the user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create/update user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        firstName: firstName,
        lastName: lastName,
        birthdate: birthdate,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });

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
    emailSignUp
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
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