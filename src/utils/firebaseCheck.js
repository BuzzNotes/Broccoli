import { auth, db, storage, reinitializeFirebase } from '../config/firebase';
import { getApps } from 'firebase/app';

/**
 * Checks if Firebase is properly initialized
 * @returns {boolean} True if Firebase is initialized, false otherwise
 */
export const isFirebaseInitialized = () => {
  try {
    // Check if Firebase app is initialized
    const appsInitialized = getApps().length > 0;
    
    // Check if all services are initialized
    const authInitialized = !!auth;
    const dbInitialized = !!db;
    const storageInitialized = !!storage;
    
    // For community features, we need at least Firestore and Storage
    const essentialServicesInitialized = dbInitialized && storageInitialized;
    
    if (!essentialServicesInitialized && appsInitialized) {
      // Try to reinitialize Firebase if the app is initialized but services aren't
      console.log('Attempting to reinitialize Firebase services...');
      reinitializeFirebase();
      
      // Check again after reinitialization
      return !!db && !!storage;
    }
    
    return appsInitialized && essentialServicesInitialized;
  } catch (error) {
    console.error('Error checking Firebase initialization:', error);
    return false;
  }
};

/**
 * Logs Firebase initialization status
 * @returns {boolean} True if all Firebase services are initialized, false otherwise
 */
export const logFirebaseStatus = () => {
  try {
    const appsInitialized = getApps().length > 0;
    const authInitialized = !!auth;
    const dbInitialized = !!db;
    const storageInitialized = !!storage;
    const allInitialized = appsInitialized && authInitialized && dbInitialized && storageInitialized;
    
    console.log(`Firebase initialization status: ${allInitialized ? 'SUCCESS' : 'PARTIAL'}`);
    console.log(`- Firebase App: ${appsInitialized ? 'Initialized' : 'Not initialized'}`);
    console.log(`- Firebase Auth: ${authInitialized ? 'Initialized' : 'Not initialized'}`);
    console.log(`- Firebase Firestore: ${dbInitialized ? 'Initialized' : 'Not initialized'}`);
    console.log(`- Firebase Storage: ${storageInitialized ? 'Initialized' : 'Not initialized'}`);
    
    if (!allInitialized) {
      console.warn('Firebase is not fully initialized. Some features may not work correctly.');
      
      if (appsInitialized && (!dbInitialized || !storageInitialized || !authInitialized)) {
        console.log('Attempting to reinitialize Firebase services...');
        const reinitialized = reinitializeFirebase();
        if (reinitialized) {
          console.log('Firebase services reinitialized successfully');
          return isFirebaseInitialized();
        }
      }
    }
    
    return allInitialized;
  } catch (error) {
    console.error('Error logging Firebase status:', error);
    return false;
  }
}; 