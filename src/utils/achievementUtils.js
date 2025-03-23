import { doc, updateDoc, arrayUnion, getDoc, increment, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Define all achievements with points
export const ALL_ACHIEVEMENTS = [
  {
    id: 'onboarding_complete',
    title: 'Fresh Start',
    description: 'Completed onboarding',
    icon: 'checkmark-circle',
    color: '#4CAF50',
    days: 0,
    points: 15
  },
  {
    id: 'day_1',
    title: 'Day 1 Done',
    description: 'First full day without weed',
    icon: 'star',
    color: '#8BC34A',
    days: 1,
    points: 5
  },
  {
    id: 'day_3',
    title: '3 Days Strong',
    description: 'Completed 3 days without smoking',
    icon: 'star',
    color: '#9CCC65',
    days: 3,
    points: 10
  },
  {
    id: 'week_1',
    title: '1 Week Warrior',
    description: '7 days weed-free',
    icon: 'trophy',
    color: '#66BB6A',
    days: 7,
    points: 15
  },
  {
    id: 'week_2',
    title: '2 Weeks Clear',
    description: '14 days weed-free',
    icon: 'hourglass',
    color: '#4CAF50',
    days: 14,
    points: 20
  },
  {
    id: 'month_1',
    title: '1 Month Free',
    description: '30 days weed-free',
    icon: 'leaf',
    color: '#43A047',
    days: 30,
    points: 30
  },
  {
    id: 'month_2',
    title: '2 Months Strong',
    description: '60 days weed-free',
    icon: 'star',
    color: '#388E3C',
    days: 60,
    points: 35
  },
  {
    id: 'month_3',
    title: '3 Months Mastery',
    description: '90 days weed-free',
    icon: 'trending-up',
    color: '#2E7D32',
    days: 90,
    points: 40
  },
  {
    id: 'month_6',
    title: '6 Months Champion',
    description: '180 days weed-free',
    icon: 'medal',
    color: '#1B5E20',
    days: 180,
    points: 45
  },
  {
    id: 'year_1',
    title: '1 Year Clean',
    description: '365 days weed-free',
    icon: 'ribbon',
    color: '#FFD700',
    days: 365,
    points: 60
  },
  {
    id: 'year_2',
    title: '2 Years Free',
    description: '730 days weed-free',
    icon: 'trophy',
    color: '#FFC107',
    days: 730,
    points: 75
  },
  {
    id: 'year_3',
    title: '3 Years Milestone',
    description: '1095 days weed-free',
    icon: 'trophy',
    color: '#FF9800',
    days: 1095,
    points: 90
  },
  {
    id: 'year_5',
    title: '5 Years Legend',
    description: '1825 days weed-free',
    icon: 'trophy',
    color: '#FF5722',
    days: 1825,
    points: 120
  }
];

// Define level thresholds
export const LEVEL_THRESHOLDS = [
  { level: 1, points: 0 },
  { level: 2, points: 30 },
  { level: 3, points: 75 },
  { level: 4, points: 150 },
  { level: 5, points: 250 },
  { level: 6, points: 375 },
  { level: 7, points: 525 },
  { level: 8, points: 700 },
  { level: 9, points: 900 },
  { level: 10, points: 1125 },
  { level: 11, points: 1375 },
  { level: 12, points: 1650 },
  { level: 13, points: 1950 },
  { level: 14, points: 2275 },
  { level: 15, points: 2625 },
  { level: 16, points: 3000 },
  { level: 17, points: 3400 },
  { level: 18, points: 3825 },
  { level: 19, points: 4275 },
  { level: 20, points: 4750 }
];

/**
 * Calculate user level based on points
 * @param {number} points - User's current points
 * @returns {object} - User's level and progress info
 */
export const calculateLevel = (points) => {
  // Find the highest level threshold that the user's points exceed
  let currentLevel = 1;
  let pointsForNextLevel = LEVEL_THRESHOLDS[1].points;
  let pointsForCurrentLevel = 0;
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i].points) {
      currentLevel = LEVEL_THRESHOLDS[i].level;
      pointsForCurrentLevel = LEVEL_THRESHOLDS[i].points;
      pointsForNextLevel = i < LEVEL_THRESHOLDS.length - 1 
        ? LEVEL_THRESHOLDS[i + 1].points 
        : pointsForCurrentLevel + 500; // If at max level, set next threshold higher
      break;
    }
  }
  
  // Calculate progress to next level
  const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const pointsEarnedTowardsNextLevel = points - pointsForCurrentLevel;
  const progressPercentage = Math.min(100, Math.floor((pointsEarnedTowardsNextLevel / pointsNeededForNextLevel) * 100));
  
  return {
    level: currentLevel,
    points,
    pointsForCurrentLevel,
    pointsForNextLevel,
    pointsNeededForNextLevel,
    pointsEarnedTowardsNextLevel,
    progressPercentage
  };
};

/**
 * Add points to user's account
 * @param {string} userId - Firebase user ID
 * @param {number} points - Points to add
 * @param {string} source - Source of points (achievement, login, journal, etc.)
 * @returns {Promise<object>} - Updated user stats
 */
export const addPoints = async (userId, points, source) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return null;
    }
    
    const userData = userDoc.data();
    const currentPoints = userData.points || 0;
    const newTotalPoints = currentPoints + points;
    
    // Calculate old and new levels
    const oldLevelInfo = calculateLevel(currentPoints);
    const newLevelInfo = calculateLevel(newTotalPoints);
    
    // Update user document with new points
    await updateDoc(userRef, {
      points: increment(points),
      lastPointsEarned: {
        amount: points,
        source: source,
        timestamp: new Date()
      }
    });
    
    // Record point history
    const pointHistoryRef = doc(db, 'users', userId, 'pointHistory', new Date().toISOString());
    await setDoc(pointHistoryRef, {
      amount: points,
      source: source,
      timestamp: new Date(),
      newTotal: newTotalPoints
    });
    
    // Check if user leveled up
    const leveledUp = newLevelInfo.level > oldLevelInfo.level;
    
    return {
      newPoints: newTotalPoints,
      pointsAdded: points,
      levelInfo: newLevelInfo,
      leveledUp
    };
  } catch (error) {
    console.error('Error adding points:', error);
    return null;
  }
};

/**
 * Award points for daily login
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - Updated user stats
 */
export const awardDailyLoginPoints = async (userId) => {
  return addPoints(userId, 5, 'daily_login');
};

/**
 * Award points for journaling
 * @param {string} userId - Firebase user ID
 * @returns {Promise<object>} - Updated user stats
 */
export const awardJournalingPoints = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return null;
    }
    
    const userData = userDoc.data();
    const lastJournalPoints = userData.lastJournalPoints || 0;
    
    // Check for 3-hour cooldown
    const now = new Date().getTime();
    const threeHoursInMs = 3 * 60 * 60 * 1000;
    const threeHoursAgo = now - threeHoursInMs;
    
    if (lastJournalPoints && lastJournalPoints > threeHoursAgo) {
      // Calculate when cooldown ends
      const cooldownEndsTime = lastJournalPoints + threeHoursInMs;
      const timeRemaining = cooldownEndsTime - now;
      
      // Convert to hours, minutes, and seconds
      const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
      const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((timeRemaining % (60 * 1000)) / 1000);
      
      // Format as HH:MM:SS with padding
      const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      return { 
        alreadyAwarded: true, 
        cooldownEnds: cooldownEndsTime,
        cooldownEndsFormatted: formattedTime,
        timeRemainingMs: timeRemaining
      };
    }
    
    // Update last journal points timestamp
    await updateDoc(userRef, {
      lastJournalPoints: now
    });
    
    // Award points
    return addPoints(userId, 5, 'journaling');
  } catch (error) {
    console.error('Error awarding journaling points:', error);
    return null;
  }
};

/**
 * Award an achievement to a user
 * @param {string} userId - Firebase user ID
 * @param {string} achievementId - Achievement ID to award
 * @returns {Promise} - Firebase updateDoc promise
 */
export const awardAchievement = async (userId, achievementId) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    // Find the achievement
    const achievement = ALL_ACHIEVEMENTS.find(a => a.id === achievementId);
    if (!achievement) {
      throw new Error(`Achievement ${achievementId} not found`);
    }
    
    // Add achievement to user's achievements array
    await updateDoc(userRef, {
      achievements: arrayUnion(achievementId)
    });
    
    // Award points for the achievement
    const pointsResult = await addPoints(userId, achievement.points, `achievement_${achievementId}`);
    
    return {
      achievement,
      pointsResult
    };
  } catch (error) {
    console.error('Error awarding achievement:', error);
    throw error;
  }
};

/**
 * Check and award any new achievements based on sobriety days
 * @param {string} userId - Firebase user ID
 * @param {number} sobrietyDays - Number of days sober
 * @returns {Promise<object[]>} - Array of newly awarded achievements with their points
 */
export const checkAndUpdateAchievements = async (userId, sobrietyDays) => {
  try {
    // Get current user achievements
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return [];
    }
    
    const userData = userDoc.data();
    const currentAchievements = userData.achievements || [];
    
    // Find achievements that should be awarded based on sobriety days
    const eligibleAchievements = ALL_ACHIEVEMENTS
      .filter(achievement => 
        achievement.days <= sobrietyDays && 
        !currentAchievements.includes(achievement.id)
      );
    
    // If there are new achievements to award
    if (eligibleAchievements.length > 0) {
      const newAchievementIds = eligibleAchievements.map(a => a.id);
      
      // Update user document with all new achievements
      await updateDoc(userRef, {
        achievements: [...currentAchievements, ...newAchievementIds]
      });
      
      // Award points for each new achievement
      const awardResults = [];
      for (const achievement of eligibleAchievements) {
        const pointsResult = await addPoints(
          userId, 
          achievement.points, 
          `achievement_${achievement.id}`
        );
        
        awardResults.push({
          achievement,
          pointsResult
        });
      }
      
      return awardResults;
    }
    
    return [];
  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

/**
 * Award the onboarding achievement to a user
 * @param {string} userId - Firebase user ID
 * @returns {Promise} - Firebase updateDoc promise
 */
export const awardOnboardingAchievement = async (userId) => {
  return awardAchievement(userId, 'onboarding_complete');
};

/**
 * Reset user's sobriety streak but keep their achievements
 * @param {string} userId - Firebase user ID
 * @returns {Promise} - Firebase updateDoc promise
 */
export const resetSobrietyStreak = async (userId) => {
  const userRef = doc(db, 'users', userId);
  
  try {
    // Set new sobriety date to today
    const today = new Date();
    
    await updateDoc(userRef, {
      sobrietyDate: today,
      // We keep the achievements array as is
    });
    
    return { success: true, newSobrietyDate: today };
  } catch (error) {
    console.error('Error resetting sobriety streak:', error);
    throw error;
  }
}; 