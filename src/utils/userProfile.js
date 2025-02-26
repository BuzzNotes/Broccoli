import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Keys for AsyncStorage
const USER_NAME_KEY = 'userName';
const USER_AGE_KEY = 'userAge';
const USER_GENDER_KEY = 'userGender';
const USER_PROFILE_IMAGE_KEY = 'userProfileImage';
const USER_PROFILE_KEY = 'userProfile';

/**
 * Get the current user's ID from Firebase Auth
 * @returns {string|null} User ID or null if not logged in
 */
export const getCurrentUserId = () => {
  const user = auth.currentUser;
  return user ? user.uid : null;
};

/**
 * Save user profile data to both Firestore and AsyncStorage
 * @param {Object} profileData - User profile data
 * @returns {Promise<Object>} The saved profile data
 */
export const saveUserProfile = async (profileData) => {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Prepare data for saving to Firestore
    const firebaseData = {
      ...profileData,
      lastUpdated: serverTimestamp()
    };
    
    // If this is a new profile, set the signUpDate
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      firebaseData.signUpDate = serverTimestamp();
    }

    // Ensure firstName and lastName if only fullName is provided
    if (profileData.fullName && (!profileData.firstName || !profileData.lastName)) {
      const names = profileData.fullName.split(' ');
      firebaseData.firstName = names[0] || '';
      firebaseData.lastName = names.length > 1 ? names.slice(1).join(' ') : '';
    }

    // Save to Firestore with merge to preserve existing data
    await setDoc(userDocRef, firebaseData, { merge: true });
    
    // Also save to AsyncStorage for offline access
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
      ...profileData,
      lastUpdated: new Date().toISOString()
    }));
    
    // For backward compatibility
    const { name, age, gender, profileImage } = profileData;
    
    const promises = [];
    
    if (name !== undefined) {
      promises.push(AsyncStorage.setItem(USER_NAME_KEY, name.trim()));
    }
    
    if (age !== undefined) {
      promises.push(AsyncStorage.setItem(USER_AGE_KEY, age.toString().trim()));
    }
    
    if (gender !== undefined) {
      promises.push(AsyncStorage.setItem(USER_GENDER_KEY, gender));
    }
    
    if (profileImage !== undefined) {
      promises.push(AsyncStorage.setItem(USER_PROFILE_IMAGE_KEY, profileImage));
    }
    
    await Promise.all(promises);
    
    return profileData;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile data from Firestore, falling back to AsyncStorage if offline
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const userId = getCurrentUserId();
    console.log("getUserProfile - Current user ID:", userId);
    
    // If user is logged in, try to get profile from Firestore
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("getUserProfile - Firestore data:", userData);
          
          // Update AsyncStorage with latest data for offline access
          // Include the userId in the stored data to ensure we're getting the right profile
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
            ...userData,
            _userId: userId, // Add userId as a special field for verification
            lastUpdated: new Date().toISOString()
          }));
          
          return userData;
        } else {
          console.log("getUserProfile - User document doesn't exist in Firestore");
          // If the user exists in Firebase Auth but not in Firestore,
          // clear any potentially outdated AsyncStorage data
          await AsyncStorage.removeItem(USER_PROFILE_KEY);
          return {};
        }
      } catch (firestoreError) {
        console.warn('Error fetching from Firestore, falling back to AsyncStorage:', firestoreError);
      }
    }
    
    // If Firestore fetch failed or user is not logged in, try AsyncStorage
    const jsonProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (jsonProfile) {
      const storedProfile = JSON.parse(jsonProfile);
      console.log("getUserProfile - AsyncStorage data:", storedProfile);
      
      // Only use the stored profile if it belongs to the current user
      if (userId && storedProfile._userId === userId) {
        return storedProfile;
      } else {
        // If the stored profile is for a different user, clear it
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        return {};
      }
    }
    
    console.log("getUserProfile - No profile found in Firestore or AsyncStorage");
    // For backward compatibility, try getting individual fields
    // But only if we have a userId to ensure we're not using data from a previous user
    if (userId) {
      const [name, age, gender, profileImage] = await Promise.all([
        AsyncStorage.getItem(USER_NAME_KEY),
        AsyncStorage.getItem(USER_AGE_KEY),
        AsyncStorage.getItem(USER_GENDER_KEY),
        AsyncStorage.getItem(USER_PROFILE_IMAGE_KEY),
      ]);
      
      return {
        firstName: name || '',
        age: age || '',
        gender: gender || '',
        profileImage: profileImage || null,
        _userId: userId
      };
    }
    
    return {}; // Return empty object if no user is logged in
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {}; // Return empty object instead of throwing to prevent app crashes
  }
};

/**
 * Update a user's profile in Firestore
 * @param {Object} profileData - Profile data to update
 * @returns {Promise<void>}
 */
export const updateUserProfile = async (profileData) => {
  try {
    const { currentUser } = auth;
    if (!currentUser) {
      throw new Error('No authenticated user');
    }
    
    const userRef = doc(db, 'users', currentUser.uid);
    
    // Check if email is an Apple private relay email
    if (profileData.email && profileData.email.includes('privaterelay.appleid.com')) {
      // Don't save Apple private relay emails to the database
      profileData.email = '';
    }
    
    // Update Firestore
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: serverTimestamp()
    });
    
    // Update AsyncStorage
    const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (storedProfile) {
      const parsedProfile = JSON.parse(storedProfile);
      const updatedProfile = {
        ...parsedProfile,
        ...profileData,
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(updatedProfile));
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Create a new user profile in Firestore when a user signs up
 * @param {Object} user - Firebase auth user object
 * @param {Object} additionalData - Additional profile data
 * @returns {Promise<Object>} The created user profile
 */
export const createUserProfile = async (user, additionalData = {}) => {
  if (!user || !user.uid) {
    throw new Error('Invalid user object');
  }
  
  try {
    const userRef = doc(db, 'users', user.uid);
    
    // Check if user already exists
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      // Just update the last login time
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      return userSnapshot.data();
    }
    
    // Extract name from user object if available
    let firstName = '';
    let lastName = '';
    
    if (additionalData.firstName) {
      firstName = additionalData.firstName;
    }
    
    if (additionalData.lastName) {
      lastName = additionalData.lastName;
    }
    
    // If no first/last name but we have displayName, extract from there
    if ((!firstName || !lastName) && user.displayName) {
      const nameParts = user.displayName.split(' ');
      if (!firstName && nameParts.length > 0) {
        firstName = nameParts[0];
      }
      if (!lastName && nameParts.length > 1) {
        lastName = nameParts.slice(1).join(' ');
      }
    }
    
    // Check if email is an Apple private relay email
    let email = user.email || additionalData.email || '';
    if (email.includes('privaterelay.appleid.com')) {
      // Don't save Apple private relay emails to the database
      email = '';
    }
    
    // Create new user profile data
    const profileData = {
      uid: user.uid,
      email: email,
      firstName,
      lastName,
      displayName: user.displayName || `${firstName} ${lastName}`.trim(),
      photoURL: user.photoURL || '',
      signUpDate: serverTimestamp(),
      lastLogin: serverTimestamp(),
      // Add any additional data passed in
      ...additionalData
    };
    
    // If additionalData contains a private relay email, remove it
    if (profileData.email && profileData.email.includes('privaterelay.appleid.com')) {
      profileData.email = '';
    }
    
    // Save to Firestore
    await setDoc(userRef, profileData);
    
    // Save to AsyncStorage for offline access
    const asyncStorageData = {
      ...profileData,
      signUpDate: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(asyncStorageData));
    
    return profileData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Checks if a user's profile has all the required fields
 * @param {Object} profile - The user profile object to check
 * @returns {Object} Object with isComplete boolean and missing fields array
 */
export const isProfileComplete = (profile = {}) => {
  // Check if we have a displayName
  if (profile.displayName && profile.displayName.trim() !== '') {
    return {
      isComplete: true,
      missingFields: []
    };
  }
  
  // Check if we have at least firstName OR lastName
  if ((profile.firstName && profile.firstName.trim() !== '') || 
      (profile.lastName && profile.lastName.trim() !== '')) {
    return {
      isComplete: true,
      missingFields: []
    };
  }
  
  // If we get here, we need both firstName and lastName
  const missingFields = [];
  
  if (!profile.firstName || profile.firstName.trim() === '') {
    missingFields.push('firstName');
  }
  
  if (!profile.lastName || profile.lastName.trim() === '') {
    missingFields.push('lastName');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

/**
 * Gets the user's full name from their profile
 * @param {Object} profile - The user profile object
 * @returns {string} The user's full name
 */
export const getUserFullName = (profile = {}) => {
  if (!profile) return '';
  
  // First priority: displayName if available
  if (profile.displayName && profile.displayName.trim() !== '') {
    return profile.displayName;
  }
  
  // Second priority: firstName + lastName if both are available
  if (profile.firstName && profile.lastName && 
      profile.firstName.trim() !== '' && profile.lastName.trim() !== '') {
    return `${profile.firstName} ${profile.lastName}`;
  }
  
  // Third priority: just firstName if available
  if (profile.firstName && profile.firstName.trim() !== '') {
    return profile.firstName;
  }
  
  // Fourth priority: just lastName if available
  if (profile.lastName && profile.lastName.trim() !== '') {
    return profile.lastName;
  }
  
  // Fifth priority: email, but only if it's not an Apple private relay email
  if (profile.email && profile.email.trim() !== '') {
    // Check if it's an Apple private relay email (they contain "privaterelay.appleid.com")
    if (profile.email.includes('privaterelay.appleid.com')) {
      return ''; // Return empty to fall back to "Anonymous User"
    }
    return profile.email;
  }
  
  // Fallback to empty string
  return '';
}; 