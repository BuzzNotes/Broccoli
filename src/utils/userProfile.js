import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const USER_NAME_KEY = 'userName';
const USER_AGE_KEY = 'userAge';
const USER_GENDER_KEY = 'userGender';
const USER_PROFILE_IMAGE_KEY = 'userProfileImage';

/**
 * Save user profile data to AsyncStorage
 * @param {Object} profileData - User profile data
 * @param {string} profileData.name - User's name
 * @param {string} profileData.age - User's age
 * @param {string} profileData.gender - User's gender
 * @param {string} profileData.profileImage - URI of user's profile image
 * @returns {Promise<void>}
 */
export const saveUserProfile = async (profileData) => {
  try {
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
    
    return true;
  } catch (error) {
    console.error('Error saving user profile:', error);
    throw error;
  }
};

/**
 * Get user profile data from AsyncStorage
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async () => {
  try {
    const [name, age, gender, profileImage] = await Promise.all([
      AsyncStorage.getItem(USER_NAME_KEY),
      AsyncStorage.getItem(USER_AGE_KEY),
      AsyncStorage.getItem(USER_GENDER_KEY),
      AsyncStorage.getItem(USER_PROFILE_IMAGE_KEY),
    ]);
    
    return {
      name: name || '',
      age: age || '',
      gender: gender || '',
      profileImage: profileImage || null,
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update specific user profile fields
 * @param {Object} fields - Fields to update
 * @returns {Promise<Object>} Updated user profile
 */
export const updateUserProfile = async (fields) => {
  try {
    // Get current profile
    const currentProfile = await getUserProfile();
    
    // Merge with new fields
    const updatedProfile = {
      ...currentProfile,
      ...fields,
    };
    
    // Save updated profile
    await saveUserProfile(updatedProfile);
    
    return updatedProfile;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}; 