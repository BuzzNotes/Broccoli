import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Keys for AsyncStorage
const STREAK_START_TIME_KEY = 'streakStartTime';
const RELAPSE_HISTORY_KEY = 'relapseHistory';

/**
 * Gets the current sober streak start time
 * @returns {Promise<number>} Timestamp in milliseconds
 */
export const getStreakStartTime = async () => {
  try {
    // First try AsyncStorage for fastest response
    const localStartTime = await AsyncStorage.getItem(STREAK_START_TIME_KEY);
    
    // If we have a valid local time, use it
    if (localStartTime) {
      return parseInt(localStartTime, 10);
    }
    
    // If we don't have a local time but user is authenticated, check Firestore
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().streak_start_time) {
        const firestoreStartTime = userDoc.data().streak_start_time;
        
        // Save to AsyncStorage for future quick access
        await AsyncStorage.setItem(STREAK_START_TIME_KEY, firestoreStartTime.toString());
        
        return firestoreStartTime;
      }
    }
    
    // If no start time found, return current time (starting now)
    const currentTime = new Date().getTime();
    await setStreakStartTime(currentTime);
    return currentTime;
  } catch (error) {
    console.error('Error getting streak start time:', error);
    // Return current time if there's an error
    return new Date().getTime();
  }
};

/**
 * Sets the streak start time
 * @param {number} timestamp - Start time in milliseconds
 * @returns {Promise<void>}
 */
export const setStreakStartTime = async (timestamp) => {
  try {
    // Validate timestamp
    if (!timestamp || isNaN(timestamp)) {
      throw new Error('Invalid timestamp');
    }
    
    // Ensure timestamp is a number
    const timeMs = parseInt(timestamp, 10);
    
    // Save to AsyncStorage
    await AsyncStorage.setItem(STREAK_START_TIME_KEY, timeMs.toString());
    
    // Save to Firestore if authenticated
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          streak_start_time: timeMs,
          last_sync_time: new Date().getTime()
        });
      } else {
        // Create new document if it doesn't exist
        await setDoc(userDocRef, {
          streak_start_time: timeMs,
          last_sync_time: new Date().getTime(),
          relapse_history: []
        });
      }
    }
  } catch (error) {
    console.error('Error setting streak start time:', error);
    throw error;
  }
};

/**
 * Calculates time elapsed since the start of the streak
 * @returns {Promise<Object>} Time units (years, months, days, hours, minutes, seconds)
 */
export const getElapsedSoberTime = async () => {
  try {
    const startTime = await getStreakStartTime();
    return calculateTimeElapsed(startTime);
  } catch (error) {
    console.error('Error calculating elapsed sober time:', error);
    return {
      milliseconds: 0,
      seconds: 0,
      minutes: 0,
      hours: 0,
      days: 0,
      weeks: 0,
      months: 0,
      years: 0
    };
  }
};

/**
 * Calculate time elapsed from a start time to now
 * @param {number} startTime - Start timestamp in milliseconds
 * @returns {Object} Time units (years, months, days, hours, minutes, seconds)
 */
export const calculateTimeElapsed = (startTime) => {
  const now = new Date().getTime();
  const diff = now - startTime;
  
  if (diff < 0) return {
    milliseconds: 0,
    seconds: 0,
    minutes: 0,
    hours: 0,
    days: 0,
    weeks: 0,
    months: 0,
    years: 0
  };
  
  // Calculate time units
  const milliseconds = diff % 1000;
  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24) % 30.44); // Average days in month
  const weeks = Math.floor(diff / (1000 * 60 * 60 * 24 * 7));
  const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44) % 12); // Average days in month
  const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)); // Account for leap years
  
  return {
    milliseconds,
    seconds,
    minutes,
    hours,
    days,
    weeks,
    months,
    years,
    // Total values for calculations
    totalMilliseconds: diff,
    totalSeconds: Math.floor(diff / 1000),
    totalMinutes: Math.floor(diff / (1000 * 60)),
    totalHours: Math.floor(diff / (1000 * 60 * 60)),
    totalDays: Math.floor(diff / (1000 * 60 * 60 * 24)),
    totalWeeks: Math.floor(diff / (1000 * 60 * 60 * 24 * 7)),
    totalMonths: Math.floor(diff / (1000 * 60 * 60 * 24 * 30.44)),
    totalYears: Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
  };
};

/**
 * Log a relapse and reset the streak timer
 * @param {string} reason - Optional reason for the relapse
 * @param {Object} previousStreak - Previous streak duration object
 * @returns {Promise<Object>} The new streak start time
 */
export const logRelapse = async (reason = '', previousStreak = null) => {
  try {
    // Get current streak data if not provided
    if (!previousStreak) {
      previousStreak = await getElapsedSoberTime();
    }
    
    // Create relapse entry
    const relapseTime = new Date().getTime();
    const relapseEntry = {
      id: relapseTime.toString(),
      timestamp: relapseTime,
      date: new Date(relapseTime).toISOString(),
      reason: reason.trim(),
      previousStreak
    };
    
    // Get existing relapse history
    const historyString = await AsyncStorage.getItem(RELAPSE_HISTORY_KEY);
    const history = historyString ? JSON.parse(historyString) : [];
    
    // Add new entry and save
    history.push(relapseEntry);
    await AsyncStorage.setItem(RELAPSE_HISTORY_KEY, JSON.stringify(history));
    
    // Update Firestore if authenticated
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      // Add the relapse to history and update the streak start time
      await updateDoc(userDocRef, {
        streak_start_time: relapseTime,
        last_sync_time: relapseTime,
        relapse_history: arrayUnion({
          timestamp: relapseTime,
          date: new Date(relapseTime).toISOString(),
          reason: reason.trim(),
          previousStreak: {
            days: previousStreak.totalDays,
            hours: previousStreak.hours,
            minutes: previousStreak.minutes,
            seconds: previousStreak.seconds
          }
        })
      });
    }
    
    // Set new streak start time
    await setStreakStartTime(relapseTime);
    
    return {
      newStreakStartTime: relapseTime,
      relapseEntry
    };
  } catch (error) {
    console.error('Error logging relapse:', error);
    throw error;
  }
};

/**
 * Get the user's relapse history
 * @returns {Promise<Array>} Array of relapse entries
 */
export const getRelapseHistory = async () => {
  try {
    // Try to get from Firestore first if authenticated
    if (auth.currentUser) {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists() && userDoc.data().relapse_history) {
        return userDoc.data().relapse_history;
      }
    }
    
    // Fall back to AsyncStorage
    const historyString = await AsyncStorage.getItem(RELAPSE_HISTORY_KEY);
    return historyString ? JSON.parse(historyString) : [];
  } catch (error) {
    console.error('Error getting relapse history:', error);
    return [];
  }
};

/**
 * Sync the streak timer data between local storage and Firestore
 * @returns {Promise<Object>} The synced streak start time
 */
export const syncSoberTimer = async () => {
  try {
    if (!auth.currentUser) {
      return { startTime: await getStreakStartTime() };
    }
    
    const userDocRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    
    const localStartTimeStr = await AsyncStorage.getItem(STREAK_START_TIME_KEY);
    const now = new Date().getTime();
    
    // If we have both local and remote data
    if (userDoc.exists() && userDoc.data().streak_start_time && localStartTimeStr) {
      const dbStartTime = userDoc.data().streak_start_time;
      const localStartTime = parseInt(localStartTimeStr, 10);
      
      // Use the earlier time (longer streak)
      if (dbStartTime < localStartTime) {
        // Database has earlier time, update local
        await AsyncStorage.setItem(STREAK_START_TIME_KEY, dbStartTime.toString());
        return { startTime: dbStartTime, source: 'firestore' };
      } else if (localStartTime < dbStartTime) {
        // Local has earlier time, update database
        await updateDoc(userDocRef, {
          streak_start_time: localStartTime,
          last_sync_time: now
        });
        return { startTime: localStartTime, source: 'local' };
      }
      
      // Times are the same, no change needed
      return { startTime: localStartTime, source: 'both' };
    } 
    // If we only have remote data
    else if (userDoc.exists() && userDoc.data().streak_start_time) {
      const dbStartTime = userDoc.data().streak_start_time;
      await AsyncStorage.setItem(STREAK_START_TIME_KEY, dbStartTime.toString());
      return { startTime: dbStartTime, source: 'firestore' };
    }
    // If we only have local data
    else if (localStartTimeStr) {
      const localStartTime = parseInt(localStartTimeStr, 10);
      
      // Create or update the user document
      if (userDoc.exists()) {
        await updateDoc(userDocRef, {
          streak_start_time: localStartTime,
          last_sync_time: now
        });
      } else {
        await setDoc(userDocRef, {
          streak_start_time: localStartTime,
          last_sync_time: now,
          relapse_history: []
        });
      }
      
      return { startTime: localStartTime, source: 'local' };
    }
    // If we have no data, create new streak
    else {
      const currentTime = now;
      await setStreakStartTime(currentTime);
      return { startTime: currentTime, source: 'new' };
    }
  } catch (error) {
    console.error('Error syncing sober timer:', error);
    // Fall back to local time or current time
    const localTime = await AsyncStorage.getItem(STREAK_START_TIME_KEY);
    const fallbackTime = localTime ? parseInt(localTime, 10) : new Date().getTime();
    return { startTime: fallbackTime, source: 'fallback' };
  }
}; 