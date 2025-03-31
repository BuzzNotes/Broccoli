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
  { level: 1, points: 0 },    // Start at level 1
  { level: 2, points: 25 },   // Need 25 points for level 2
  { level: 3, points: 55 },   // Need 30 more points (25+30=55)
  { level: 4, points: 90 },   // Need 35 more points (55+35=90)
  { level: 5, points: 130 },  // Need 40 more points (90+40=130)
  { level: 6, points: 175 },  // Need 45 more points (130+45=175)
  { level: 7, points: 225 },  // Need 50 more points (175+50=225)
  { level: 8, points: 280 },  // Need 55 more points (225+55=280)
  { level: 9, points: 340 },  // Need 60 more points (280+60=340)
  { level: 10, points: 405 }, // Need 65 more points (340+65=405)
  { level: 11, points: 475 }, // Need 70 more points (405+70=475)
  { level: 12, points: 550 }, // Need 75 more points (475+75=550)
  { level: 13, points: 630 }, // Need 80 more points (550+80=630)
  { level: 14, points: 715 }, // Need 85 more points (630+85=715)
  { level: 15, points: 805 }, // Need 90 more points (715+90=805)
  { level: 16, points: 900 }, // Need 95 more points (805+95=900)
  { level: 17, points: 1000 }, // Need 100 more points (900+100=1000)
  { level: 18, points: 1105 }, // Need 105 more points (1000+105=1105)
  { level: 19, points: 1215 }, // Need 110 more points (1105+110=1215)
  { level: 20, points: 1330 }  // Need 115 more points (1215+115=1330)
];

/**
 * Calculate user level based on points
 * @param {number} points - User's current total points
 * @returns {object} - User's level and progress info
 */
export const calculateLevel = (points) => {
  // Find the highest level threshold that the user's points exceed
  let currentLevel = 1;
  let pointsForCurrentLevel = 0;
  let pointsForNextLevel = LEVEL_THRESHOLDS[1].points;
  
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
  
  // Calculate points within the current level (levelPoints)
  const totalPoints = points;
  const levelPoints = points - pointsForCurrentLevel;
  
  // Calculate progress to next level
  const pointsNeededForNextLevel = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercentage = Math.min(100, Math.floor((levelPoints / pointsNeededForNextLevel) * 100));
  
  // Calculate remaining points needed to level up
  const pointsToNextLevel = pointsNeededForNextLevel - levelPoints;
  
  return {
    level: currentLevel,
    totalPoints,      // Total accumulated points
    levelPoints,      // Points within current level (resets to 0 on level up)
    pointsForCurrentLevel,
    pointsForNextLevel,
    pointsNeededForNextLevel,
    pointsToNextLevel, // Points still needed to level up
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
    
    // Check for 12-hour cooldown
    const now = new Date().getTime();
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const twelveHoursAgo = now - twelveHoursInMs;
    
    if (lastJournalPoints && lastJournalPoints > twelveHoursAgo) {
      // Calculate when cooldown ends
      const cooldownEndsTime = lastJournalPoints + twelveHoursInMs;
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
    console.log(`Checking achievements for user ${userId} with ${sobrietyDays} sober days`);
    
    // Get current user achievements
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return [];
    }
    
    const userData = userDoc.data();
    const currentAchievements = userData.achievements || [];
    
    console.log(`Current achievements: ${currentAchievements.join(', ') || 'none'}`);
    
    // Find achievements that should be awarded based on sobriety days
    const eligibleAchievements = ALL_ACHIEVEMENTS
      .filter(achievement => 
        achievement.days <= sobrietyDays && 
        !currentAchievements.includes(achievement.id)
      );
    
    console.log(`Found ${eligibleAchievements.length} eligible new achievements`);
    
    // If there are new achievements to award
    if (eligibleAchievements.length > 0) {
      const newAchievementIds = eligibleAchievements.map(a => a.id);
      
      console.log(`Awarding new achievements: ${newAchievementIds.join(', ')}`);
      
      // Update user document with all new achievements
      await updateDoc(userRef, {
        achievements: arrayUnion(...newAchievementIds)
      });
      
      // Award points for each new achievement
      const awardResults = [];
      for (const achievement of eligibleAchievements) {
        console.log(`Awarding ${achievement.points} points for achievement: ${achievement.id}`);
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

/**
 * Award points for meditation sessions longer than 1 minute
 * @param {string} userId - Firebase user ID
 * @param {number} meditationSeconds - Duration of meditation in seconds
 * @returns {Promise<object>} - Updated user stats
 */
export const awardMeditationPoints = async (userId, meditationSeconds) => {
  try {
    // Only award points for sessions longer than 1 minute
    if (meditationSeconds < 60) {
      return { 
        insufficientDuration: true,
        message: 'Meditation was too short to earn points (less than 1 minute)'
      };
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found');
      return null;
    }
    
    const userData = userDoc.data();
    const lastMeditationPoints = userData.lastMeditationPoints || 0;
    
    // Check for 24-hour cooldown
    const now = new Date().getTime();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
    const twentyFourHoursAgo = now - twentyFourHoursInMs;
    
    if (lastMeditationPoints && lastMeditationPoints > twentyFourHoursAgo) {
      // Calculate when cooldown ends
      const cooldownEndsTime = lastMeditationPoints + twentyFourHoursInMs;
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
    
    // Update last meditation points timestamp
    await updateDoc(userRef, {
      lastMeditationPoints: now,
      // Also store the duration of the last meditation
      lastMeditationDuration: meditationSeconds
    });
    
    // Award points
    return addPoints(userId, 5, 'meditation');
  } catch (error) {
    console.error('Error awarding meditation points:', error);
    return null;
  }
};

export const checkJournalPointsEligibility = async (userId) => {
  try {
    if (!userId) return null;
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    const lastJournalPoints = userData.lastJournalPoints || 0;
    const now = Date.now();
    
    // Check if 12 hours have passed since last journal entry with points
    const twelveHoursInMs = 12 * 60 * 60 * 1000;
    const twelveHoursAgo = now - twelveHoursInMs;
    
    // If user has never received points or received them more than 12 hours ago
    if (!lastJournalPoints || lastJournalPoints <= twelveHoursAgo) {
      return { eligible: true, reason: 'Cooldown complete' };
    }
    
    // Calculate time remaining in cooldown
    const cooldownEndsTime = lastJournalPoints + twelveHoursInMs;
    const msRemaining = cooldownEndsTime - now;
    
    // Format hours and minutes remaining
    const hoursRemaining = Math.floor(msRemaining / (60 * 60 * 1000));
    const minutesRemaining = Math.floor((msRemaining % (60 * 60 * 1000)) / (60 * 1000));
    
    return {
      eligible: false,
      reason: 'Cooldown active',
      cooldownEnds: cooldownEndsTime,
      timeRemainingMs: msRemaining,
      formattedTimeRemaining: `${hoursRemaining}h ${minutesRemaining}m`
    };
  } catch (error) {
    console.error('Error checking journal points eligibility:', error);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}; 