import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  auth,
  db 
} from '../config/firebase';
import {
  signInWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: '1079081190424-bo66njc6lellu79jdgnmeog14p3c904s.apps.googleusercontent.com',
    iosClientId: '1079081190424-bo66njc6lellu79jdgnmeog14p3c904s.apps.googleusercontent.com',
    webClientId: '1079081190424-bo66njc6lellu79jdgnmeog14p3c904s.apps.googleusercontent.com',
    scopes: [
      'profile',
      'email'
    ]
  });

  async function googleSignIn() {
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const credential = GoogleAuthProvider.credential(result.params.id_token);
        const userCredential = await signInWithCredential(auth, credential);
        
        // Create/update user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: userCredential.user.email,
          name: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          lastLogin: new Date().toISOString()
        }, { merge: true });

        // Store user data in AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
        
        // Navigate to onboarding
        router.push('/(onboarding)/good-news');
      }
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  }

  async function appleSignIn() {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Create Firebase credential with the correct audience based on environment
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      // Set the correct audience based on environment
      const audience = Constants.appOwnership === 'expo' 
        ? 'host.exp.Exponent' 
        : 'com.sixfortylabs.broccoli';
      
      provider.setCustomParameters({
        audience: audience
      });

      const authCredential = provider.credential({
        idToken: credential.identityToken,
        rawNonce: credential.nonce,
      });

      // Sign in with Firebase
      const userCredential = await signInWithCredential(auth, authCredential);
      
      // Create/update user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email,
        name: credential.fullName 
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
          : userCredential.user.displayName,
        lastLogin: new Date().toISOString()
      }, { merge: true });

    } catch (error) {
      console.error("Error signing in with Apple:", error);
      throw error;
    }
  }

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

  async function logOut() {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem('user');
      router.replace('/(auth)/login');
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = {
          ...user,
          profile: userDoc.data()
        };
        setCurrentUser(userData);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
      } else {
        setCurrentUser(null);
        await AsyncStorage.removeItem('user');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    googleSignIn,
    appleSignIn,
    emailSignUp,
    logOut
  };

  console.log('Auth context value:', value);

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 