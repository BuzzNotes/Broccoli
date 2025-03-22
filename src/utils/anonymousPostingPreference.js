import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  saveAnonymousPostingPreferenceToProfile, 
  getAnonymousPostingPreferenceFromProfile 
} from './userProfile';

// Backward compatibility key for older app versions
const ANONYMOUS_POSTING_KEY = '@Broccoli:anonymousPosting';

/**
 * Save anonymous posting preference
 * @param {boolean} isAnonymous - Whether posts should be anonymous
 * @returns {Promise<boolean>} - Success status
 */
export const saveAnonymousPostingPreference = async (isAnonymous) => {
  try {
    // Save to old AsyncStorage location for backward compatibility
    await AsyncStorage.setItem(ANONYMOUS_POSTING_KEY, JSON.stringify(isAnonymous));
    
    // Save to user profile for new functionality
    await saveAnonymousPostingPreferenceToProfile(isAnonymous);
    
    return true;
  } catch (error) {
    console.error('Error saving anonymous posting preference:', error);
    return false;
  }
};

/**
 * Get anonymous posting preference
 * @returns {Promise<boolean>} - The preference (default: false)
 */
export const getAnonymousPostingPreference = async () => {
  try {
    // First try to get from user profile (new method)
    try {
      const profilePreference = await getAnonymousPostingPreferenceFromProfile();
      if (profilePreference !== undefined) {
        return profilePreference;
      }
    } catch (profileError) {
      // Silently fail and try the old method
      console.log('Could not get preference from profile, trying legacy storage');
    }
    
    // If not found in profile, try legacy storage
    const legacyPreference = await AsyncStorage.getItem(ANONYMOUS_POSTING_KEY);
    if (legacyPreference !== null) {
      return JSON.parse(legacyPreference);
    }
    
    // Default to false if not found
    return false;
  } catch (error) {
    console.error('Error getting anonymous posting preference:', error);
    return false;
  }
}; 