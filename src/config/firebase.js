import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Make sure these values exactly match what's in your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyByvbQtlvX5-RFKIVdLP_3Zp0kQx7XF_sg",
  authDomain: "broccoli-5d02e.firebaseapp.com",
  databaseURL: "https://broccoli-5d02e-default-rtdb.firebaseio.com",
  projectId: "broccoli-5d02e",
  storageBucket: "broccoli-5d02e.appspot.com",
  messagingSenderId: "440453285839",
  appId: "1:440453285839:web:7bbc3fdca7668ae00974ba",
  measurementId: "G-NJL2BKSZ5C"
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;

/**
 * Initialize Firebase app and services
 * This function is called immediately and exports are available for import
 */
const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized to prevent duplicate apps
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
      console.log('Firebase app initialized successfully');
    } else {
      app = getApp();
      console.log('Using existing Firebase app');
    }

    // Initialize Auth with AsyncStorage persistence for React Native
    try {
      if (Platform.OS === 'web') {
        auth = getAuth(app);
      } else {
        try {
          auth = getAuth(app);
        } catch (authError) {
          console.log('Initializing auth with persistence');
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
        }
      }
      console.log('Firebase Auth initialized successfully');
    } catch (authError) {
      console.error('Firebase Auth initialization error:', authError);
    }

    // Initialize Firestore
    try {
      db = getFirestore(app);
      console.log('Firebase Firestore initialized successfully');
    } catch (dbError) {
      console.error('Firebase Firestore initialization error:', dbError);
    }
    
    // Initialize Storage
    try {
      storage = getStorage(app);
      console.log('Firebase Storage initialized successfully');
    } catch (storageError) {
      console.error('Firebase Storage initialization error:', storageError);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    console.warn("App will continue with limited functionality");
    return false;
  }
};

// Initialize Firebase immediately
initializeFirebase();

// Export the Firebase services
export { auth, db, storage };

// Export a function to reinitialize Firebase if needed
export const reinitializeFirebase = initializeFirebase; 