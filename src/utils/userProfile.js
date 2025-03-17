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
 * Get the current user's profile from Firestore or AsyncStorage
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const userId = getCurrentUserId();
    console.log("getUserProfile - Current user ID:", userId);
    console.log("getUserProfile - Using Firebase project:", db._databaseId.projectId);
    
    // If user is logged in, try to get profile from Firestore
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        console.log("getUserProfile - Attempting to fetch document from path:", `users/${userId}`);
        
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log("getUserProfile - Firestore data retrieved successfully:", userData);
          
          // Update AsyncStorage with latest data for offline access
          // Include the userId in the stored data to ensure we're getting the right profile
          await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify({
            ...userData,
            _userId: userId, // Add userId as a special field for verification
            lastUpdated: new Date().toISOString()
          }));
          
          return userData;
        } else {
          console.log("getUserProfile - User document doesn't exist in Firestore for user:", userId);
          console.log("getUserProfile - This may indicate the user exists in Firebase Auth but not in the Firestore database");
          
          // If the user exists in Firebase Auth but not in Firestore,
          // clear any potentially outdated AsyncStorage data
          await AsyncStorage.removeItem(USER_PROFILE_KEY);
          return {};
        }
      } catch (firestoreError) {
        console.warn('Error fetching from Firestore, falling back to AsyncStorage:', firestoreError);
        console.warn('Firestore error details:', JSON.stringify(firestoreError));
      }
    }
    
    // If Firestore fetch failed or user is not logged in, try AsyncStorage
    console.log("getUserProfile - Attempting to fetch from AsyncStorage");
    const jsonProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
    if (jsonProfile) {
      const storedProfile = JSON.parse(jsonProfile);
      console.log("getUserProfile - AsyncStorage data:", storedProfile);
      
      // Only use the stored profile if it belongs to the current user
      if (userId && storedProfile._userId === userId) {
        console.log("getUserProfile - Using profile from AsyncStorage (matches current user)");
        return storedProfile;
      } else {
        // If the stored profile is for a different user, clear it
        console.log("getUserProfile - Stored profile is for a different user, clearing");
        await AsyncStorage.removeItem(USER_PROFILE_KEY);
        return {};
      }
    }
    
    console.log("getUserProfile - No profile found in Firestore or AsyncStorage");
    // For backward compatibility, try getting individual fields
    // But only if we have a userId to ensure we're not using data from a previous user
    if (userId) {
      console.log("getUserProfile - Attempting to retrieve legacy individual fields from AsyncStorage");
      const [name, age, gender, profileImage] = await Promise.all([
        AsyncStorage.getItem(USER_NAME_KEY),
        AsyncStorage.getItem(USER_AGE_KEY),
        AsyncStorage.getItem(USER_GENDER_KEY),
        AsyncStorage.getItem(USER_PROFILE_IMAGE_KEY),
      ]);
      
      const legacyProfile = {
        firstName: name || '',
        age: age || '',
        gender: gender || '',
        profileImage: profileImage || null,
        _userId: userId
      };
      
      console.log("getUserProfile - Retrieved legacy profile:", legacyProfile);
      return legacyProfile;
    }
    
    console.log("getUserProfile - No user logged in or no profile data found anywhere");
    return {}; // Return empty object if no user is logged in
  } catch (error) {
    console.error('Error getting user profile:', error);
    console.error('Error details:', JSON.stringify(error));
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
    console.error('createUserProfile - Invalid user object:', user);
    throw new Error('Invalid user object');
  }
  
  try {
    console.log("createUserProfile - Creating/updating profile for user:", user.uid);
    console.log("createUserProfile - Using Firebase project:", db._databaseId.projectId);
    console.log("createUserProfile - Additional data:", additionalData);
    
    const userRef = doc(db, 'users', user.uid);
    console.log("createUserProfile - User document path:", `users/${user.uid}`);
    
    // Check if user already exists
    console.log("createUserProfile - Checking if user already exists in Firestore");
    const userSnapshot = await getDoc(userRef);
    if (userSnapshot.exists()) {
      console.log("createUserProfile - User already exists, updating last login time");
      const existingData = userSnapshot.data();
      console.log("createUserProfile - Existing user data:", existingData);
      
      // Just update the last login time
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      
      console.log("createUserProfile - Last login time updated successfully");
      return existingData;
    }
    
    console.log("createUserProfile - User does not exist, creating new profile");
    
    // Extract name from user object if available
    let firstName = '';
    let lastName = '';
    let displayName = '';
    
    // First priority: use additionalData if provided
    if (additionalData.firstName) {
      firstName = additionalData.firstName.trim();
      console.log("createUserProfile - Using firstName from additionalData:", firstName);
    }
    
    if (additionalData.lastName) {
      lastName = additionalData.lastName.trim();
      console.log("createUserProfile - Using lastName from additionalData:", lastName);
    }
    
    if (additionalData.displayName) {
      displayName = additionalData.displayName.trim();
      console.log("createUserProfile - Using displayName from additionalData:", displayName);
    }
    
    // Second priority: if no first/last name but we have user.displayName, extract from there
    if ((!firstName || !lastName) && user.displayName) {
      console.log("createUserProfile - Extracting name from user.displayName:", user.displayName);
      const nameParts = user.displayName.split(' ');
      
      if (!firstName && nameParts.length > 0) {
        firstName = nameParts[0].trim();
        console.log("createUserProfile - Extracted firstName:", firstName);
      }
      
      if (!lastName && nameParts.length > 1) {
        lastName = nameParts.slice(1).join(' ').trim();
        console.log("createUserProfile - Extracted lastName:", lastName);
      }
      
      // If displayName wasn't provided in additionalData, use user.displayName
      if (!displayName) {
        displayName = user.displayName.trim();
        console.log("createUserProfile - Using displayName from user object:", displayName);
      }
    }
    
    // Check if email is an Apple private relay email
    let email = user.email || additionalData.email || '';
    if (email.includes('privaterelay.appleid.com')) {
      console.log("createUserProfile - Apple private relay email detected, not saving to database");
      // Don't save Apple private relay emails to the database
      email = '';
    }
    
    // Create new user profile data
    const profileData = {
      uid: user.uid,
      email: email,
      firstName,
      lastName,
      displayName: displayName || `${firstName} ${lastName}`.trim(),
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
    
    console.log("createUserProfile - Final profile data to save:", JSON.stringify(profileData));
    
    // Save to Firestore
    try {
      await setDoc(userRef, profileData);
      console.log("createUserProfile - Profile successfully saved to Firestore");
    } catch (firestoreError) {
      console.error("createUserProfile - Error saving to Firestore:", firestoreError);
      console.error("createUserProfile - Error details:", JSON.stringify(firestoreError));
      throw firestoreError;
    }
    
    // Save to AsyncStorage for offline access
    const asyncStorageData = {
      ...profileData,
      _userId: user.uid, // Add userId as a special field for verification
      signUpDate: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };
    
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(asyncStorageData));
      console.log("createUserProfile - Profile successfully saved to AsyncStorage");
    } catch (asyncError) {
      console.error("createUserProfile - Error saving to AsyncStorage:", asyncError);
      // Don't throw here, as Firestore is the primary storage
    }
    
    return profileData;
  } catch (error) {
    console.error('Error creating user profile:', error);
    console.error('Error details:', JSON.stringify(error));
    throw error;
  }
};

/**
 * Checks if a user's profile has all the required fields
 * @param {Object} profile - The user profile object to check
 * @returns {Object} Object with isComplete boolean and missing fields array
 */
export const isProfileComplete = (profile = {}) => {
  // First check if onboarding is explicitly marked as completed
  if (profile.onboarding_completed === true && profile.onboarding_state === 'completed') {
    return {
      isComplete: true,
      missingFields: []
    };
  }
  
  // If onboarding status isn't explicitly set, check for required fields
  const missingFields = [];
  
  // Check name fields
  if (!profile.firstName || profile.firstName.trim() === '') {
    missingFields.push('firstName');
  }
  
  if (!profile.lastName || profile.lastName.trim() === '') {
    missingFields.push('lastName');
  }
  
  // Check onboarding-specific fields
  if (!profile.questions_completed) {
    missingFields.push('questions_completed');
  }
  
  if (!profile.payment_completed) {
    missingFields.push('payment_completed');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields
  };
};

/**
 * Gets a formatted full name from the profile
 * @param {Object} profile - The user profile object
 * @returns {string} The user's full name
 */
export const getUserFullName = (profile = {}) => {
  if (!profile) {
    console.log("getUserFullName - Profile is null or undefined");
    return '';
  }
  
  console.log("getUserFullName - Input profile:", JSON.stringify(profile));
  
  // First priority: displayName if available
  if (profile.displayName && profile.displayName.trim() !== '') {
    console.log("getUserFullName - Using displayName:", profile.displayName);
    return profile.displayName;
  }
  
  // Second priority: firstName + lastName if both are available
  if (profile.firstName && profile.lastName && 
      profile.firstName.trim() !== '' && profile.lastName.trim() !== '') {
    const fullName = `${profile.firstName} ${profile.lastName}`;
    console.log("getUserFullName - Using firstName + lastName:", fullName);
    return fullName;
  }
  
  // Third priority: just firstName if available
  if (profile.firstName && profile.firstName.trim() !== '') {
    console.log("getUserFullName - Using only firstName:", profile.firstName);
    return profile.firstName;
  }
  
  // Fourth priority: just lastName if available
  if (profile.lastName && profile.lastName.trim() !== '') {
    console.log("getUserFullName - Using only lastName:", profile.lastName);
    return profile.lastName;
  }
  
  // Fifth priority: provider-specific handling
  if (profile.provider === 'apple') {
    console.log("getUserFullName - Apple user without name, checking for alternative identifiers");
    
    // For Apple users, we might have user.uid or a partial email
    if (profile.uid) {
      console.log("getUserFullName - Using 'Apple User' with partial UID");
      return `Apple User (${profile.uid.substring(0, 5)}...)`;
    }
  }
  
  // Sixth priority: email, but only if it's not an Apple private relay email
  if (profile.email && profile.email.trim() !== '') {
    // Check if it's an Apple private relay email (they contain "privaterelay.appleid.com")
    if (profile.email.includes('privaterelay.appleid.com')) {
      console.log("getUserFullName - Found Apple private relay email, not using");
      return 'Apple User'; // Return a generic name for Apple users
    }
    
    // For regular emails, use the part before @ as a name
    const emailName = profile.email.split('@')[0];
    // Capitalize and format the email name
    const formattedName = emailName
      .split(/[._-]/)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
      
    console.log("getUserFullName - Using formatted email name:", formattedName);
    return formattedName;
  }
  
  console.log("getUserFullName - No valid name found, returning empty string");
  return '';
}; 