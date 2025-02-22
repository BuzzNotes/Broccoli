import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyByvbQtlvX5-RFKIVdLP_3Zp0kQx7XF_sg",
  authDomain: "broccoli-5d02e.firebaseapp.com",
  projectId: "broccoli-5d02e",
  storageBucket: "broccoli-5d02e.appspot.com",
  messagingSenderId: "440453285839",
  appId: "1:440453285839:web:7bbc3fdca7668ae00974ba",
  measurementId: "G-NJL2BKSZ5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export { auth }; 