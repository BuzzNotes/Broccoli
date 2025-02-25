
import { initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
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

// Initialize Firebase with a custom name for Expo Go
let app;
try {
  if (Constants.appOwnership === 'expo') {
    // For Expo Go
    app = initializeApp(firebaseConfig, 'Expo Go');
  } else {
    // For production build
    app = initializeApp(firebaseConfig);
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
  throw error;
}

// Initialize Auth with AsyncStorage persistence for React Native
const auth = Platform.OS === 'web' 
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });

// Initialize Firestore
const db = getFirestore(app);

export { auth, db }; 