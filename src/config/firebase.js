import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Firebase configuration for project broccoli-452000
const firebaseConfig = {
  apiKey: "AIzaSyCC1RNORXgRcT82vA8cQ6axBW047w3BBDA",
  authDomain: "broccoli-452000.firebaseapp.com",
  projectId: "broccoli-452000",
  storageBucket: "broccoli-452000.appspot.com",
  messagingSenderId: "1079081190424",
  appId: "1:1079081190424:web:9fee6afd2bdee2dd762f6d",
  measurementId: "G-DKPEER8WNF"
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
    console.log("Initializing Firebase with config:", JSON.stringify({
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      messagingSenderId: firebaseConfig.messagingSenderId
    }));
    
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
        console.log('Firebase Auth initialized for web');
      } else {
        try {
          auth = getAuth(app);
          console.log('Firebase Auth initialized for mobile');
        } catch (authError) {
          console.log('Initializing auth with persistence');
          auth = initializeAuth(app, {
            persistence: getReactNativePersistence(AsyncStorage)
          });
          console.log('Firebase Auth initialized with persistence');
        }
      }
      console.log('Firebase Auth initialized successfully');
    } catch (authError) {
      console.error('Firebase Auth initialization error:', authError);
      console.error('Error code:', authError.code);
      console.error('Error message:', authError.message);
    }

    // Initialize Firestore
    try {
      db = getFirestore(app);
      console.log('Firebase Firestore initialized successfully');
    } catch (dbError) {
      console.error('Firebase Firestore initialization error:', dbError);
      console.error('Error code:', dbError.code);
      console.error('Error message:', dbError.message);
    }
    
    // Initialize Storage
    try {
      storage = getStorage(app);
      console.log('Firebase Storage initialized successfully');
    } catch (storageError) {
      console.error('Firebase Storage initialization error:', storageError);
      console.error('Error code:', storageError.code);
      console.error('Error message:', storageError.message);
    }
    
    return true;
  } catch (error) {
    console.error("Firebase initialization error:", error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
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