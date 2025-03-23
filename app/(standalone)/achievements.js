import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../../app/styles/typography';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import { auth, db } from '../../src/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import BannerNotification from '../../src/components/BannerNotification';
import { ALL_ACHIEVEMENTS, calculateLevel } from '../../src/utils/achievementUtils';

const AchievementsScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [userAchievements, setUserAchievements] = useState([]);
  const [streakDays, setStreakDays] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('info');
  const [userPoints, setUserPoints] = useState(0);
  const [levelInfo, setLevelInfo] = useState(null);
  
  // Auto-hide banner after a duration
  useEffect(() => {
    if (bannerVisible) {
      const timer = setTimeout(() => {
        setBannerVisible(false);
      }, 3000); // Hide after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [bannerVisible]);
  
  useEffect(() => {
    fetchUserAchievements();
  }, []);
  
  const fetchUserAchievements = async () => {
    try {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        showBanner('Please sign in to view your achievements', 'error');
        setLoading(false);
        return;
      }
      
      const userId = auth.currentUser.uid;
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserAchievements(userData.achievements || []);
        
        // Get streak days from the user document
        if (userData.sobrietyDate) {
          const sobrietyDate = userData.sobrietyDate.toDate();
          const today = new Date();
          const diffTime = Math.abs(today - sobrietyDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setStreakDays(diffDays);
        }
        
        // Get user points and calculate level
        const points = userData.points || 0;
        setUserPoints(points);
        setLevelInfo(calculateLevel(points));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading achievements:', error);
      showBanner('Failed to load achievements', 'error');
      setLoading(false);
    }
  };
  
  const showBanner = (message, type = 'info') => {
    setBannerMessage(message);
    setBannerType(type);
    setBannerVisible(true);
  };
  
  const hideBanner = () => {
    setBannerVisible(false);
  };
  
  // Add a function to navigate back to the recovery screen with progress tab
  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/(main)/recovery',
      params: { initialTab: 'progress' }
    });
  };
  
  const isAchievementUnlocked = (achievementId) => {
    return userAchievements.includes(achievementId);
  };
  
  const isAchievementNext = (achievementDays) => {
    return !isNaN(streakDays) && 
           streakDays < achievementDays && 
           !ALL_ACHIEVEMENTS.some(a => a.days > streakDays && a.days < achievementDays);
  };
  
  const getDaysRemaining = (achievementDays) => {
    if (isNaN(streakDays)) return 0;
    return Math.max(0, achievementDays - streakDays);
  };
  
  const renderAchievementItem = (achievement) => {
    const unlocked = isAchievementUnlocked(achievement.id);
    const isNext = isAchievementNext(achievement.days);
    const daysRemaining = getDaysRemaining(achievement.days);
    const isRecentlyUnlocked = unlocked && achievement.days > 0 && 
                               Math.abs(achievement.days - streakDays) <= 1;
    
    return (
      <View 
        key={achievement.id} 
        style={[
          styles.achievementItem,
          unlocked ? styles.achievementUnlocked : null,
          isNext ? styles.achievementNext : null,
          isRecentlyUnlocked ? styles.achievementRecent : null
        ]}
      >
        <View style={[styles.achievementIconContainer, { backgroundColor: unlocked ? achievement.color : '#E0E0E0' }]}>
          <Ionicons 
            name={achievement.icon} 
            size={28} 
            color={unlocked ? '#FFFFFF' : '#AAAAAA'} 
          />
        </View>
        
        <View style={styles.achievementInfo}>
          <View style={styles.achievementTitleRow}>
            <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>
              {achievement.title}
            </Text>
            {unlocked && (
              <View style={styles.unlockedBadge}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            )}
            {isRecentlyUnlocked && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW!</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.achievementDescription}>
            {achievement.description}
          </Text>
          
          <View style={styles.pointsContainer}>
            <Ionicons name="star" size={14} color={unlocked ? '#FFD700' : '#AAAAAA'} />
            <Text style={[styles.pointsText, !unlocked && styles.pointsTextLocked]}>
              {achievement.points} points
            </Text>
          </View>
          
          {!unlocked && achievement.days > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${Math.min(100, (streakDays / achievement.days) * 100)}%`,
                      backgroundColor: isNext ? achievement.color : '#CCCCCC'
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.daysRemaining, isNext && { color: achievement.color }]}>
                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} to go
              </Text>
            </View>
          )}
          
          {isRecentlyUnlocked && (
            <View style={styles.congratsContainer}>
              <Text style={styles.congratsText}>
                🎉 Congratulations on this achievement!
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Banner notification */}
      {bannerVisible && (
        <BannerNotification
          visible={bannerVisible}
          message={bannerMessage}
          type={bannerType}
          onHide={hideBanner}
        />
      )}
      
      {/* Light background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#F5F5F5'}} />
      </View>
      
      {/* Header with back button */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Achievements</Text>
        <View style={{ width: 24 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading achievements...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 60 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Level Card */}
          {levelInfo && (
            <View style={styles.levelCard}>
              <View style={styles.levelHeader}>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelBadgeText}>{levelInfo.level}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>Level {levelInfo.level}</Text>
                  <Text style={styles.levelSubtitle}>Recovery Master</Text>
                </View>
              </View>
              
              <View style={styles.levelProgressContainer}>
                <View style={styles.levelProgressBar}>
                  <View 
                    style={[
                      styles.levelProgressFill, 
                      { width: `${levelInfo.progressPercentage}%` }
                    ]} 
                  />
                </View>
                <View style={styles.levelProgressLabels}>
                  <Text style={styles.levelProgressText}>
                    {levelInfo.pointsEarnedTowardsNextLevel} / {levelInfo.pointsNeededForNextLevel} points
                  </Text>
                  <Text style={styles.levelProgressPercentage}>
                    {levelInfo.progressPercentage}%
                  </Text>
                </View>
              </View>
              
              <View style={styles.totalPointsContainer}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.totalPointsText}>{userPoints} total points</Text>
              </View>
            </View>
          )}
          
          {/* Current Status */}
          <View style={styles.currentStatusCard}>
            <View style={styles.streakContainer}>
              <Text style={styles.streakLabel}>Your Current Streak</Text>
              <Text style={styles.streakValue}>{streakDays || 0}</Text>
              <Text style={styles.streakUnit}>days</Text>
            </View>
            
            <View style={styles.achievementStatsContainer}>
              <View style={styles.achievementStat}>
                <Text style={styles.achievementStatValue}>
                  {userAchievements.length}
                </Text>
                <Text style={styles.achievementStatLabel}>
                  Earned
                </Text>
              </View>
              
              <View style={styles.achievementStat}>
                <Text style={styles.achievementStatValue}>
                  {ALL_ACHIEVEMENTS.length - userAchievements.length}
                </Text>
                <Text style={styles.achievementStatLabel}>
                  To Go
                </Text>
              </View>
            </View>
          </View>
          
          {/* Next Achievement */}
          {ALL_ACHIEVEMENTS.find(a => isAchievementNext(a.days)) && (
            <View style={styles.nextAchievementCard}>
              <Text style={styles.nextAchievementTitle}>Next Achievement</Text>
              {renderAchievementItem(ALL_ACHIEVEMENTS.find(a => isAchievementNext(a.days)))}
            </View>
          )}
          
          {/* Point Sources */}
          <View style={styles.pointSourcesCard}>
            <Text style={styles.pointSourcesTitle}>Ways to Earn Points</Text>
            
            <View style={styles.pointSourceItem}>
              <View style={styles.pointSourceIcon}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
              </View>
              <View style={styles.pointSourceInfo}>
                <Text style={styles.pointSourceName}>Complete Onboarding</Text>
                <Text style={styles.pointSourceDescription}>One-time reward for starting your journey</Text>
              </View>
              <Text style={styles.pointSourceValue}>+15</Text>
            </View>
            
            <View style={styles.pointSourceItem}>
              <View style={styles.pointSourceIcon}>
                <Ionicons name="today" size={24} color="#2196F3" />
              </View>
              <View style={styles.pointSourceInfo}>
                <Text style={styles.pointSourceName}>Daily Login</Text>
                <Text style={styles.pointSourceDescription}>Log in once every 24 hours</Text>
              </View>
              <Text style={styles.pointSourceValue}>+5</Text>
            </View>
            
            <View style={styles.pointSourceItem}>
              <View style={styles.pointSourceIcon}>
                <Ionicons name="journal" size={24} color="#9C27B0" />
              </View>
              <View style={styles.pointSourceInfo}>
                <Text style={styles.pointSourceName}>Journal Entry</Text>
                <Text style={styles.pointSourceDescription}>Write in your journal (1-hour cooldown)</Text>
              </View>
              <Text style={styles.pointSourceValue}>+5</Text>
            </View>
            
            <View style={styles.pointSourceItem}>
              <View style={styles.pointSourceIcon}>
                <Ionicons name="trophy" size={24} color="#FFD700" />
              </View>
              <View style={styles.pointSourceInfo}>
                <Text style={styles.pointSourceName}>Achievements</Text>
                <Text style={styles.pointSourceDescription}>Unlock achievements for extra points</Text>
              </View>
              <Text style={styles.pointSourceValue}>+5-120</Text>
            </View>
          </View>
          
          {/* All Achievements */}
          <View style={styles.allAchievementsCard}>
            <Text style={styles.allAchievementsTitle}>All Achievements</Text>
            
            {ALL_ACHIEVEMENTS.map(achievement => renderAchievementItem(achievement))}
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  levelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelBadgeText: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  levelSubtitle: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
  },
  levelProgressContainer: {
    marginBottom: 12,
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  levelProgressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  levelProgressText: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  levelProgressPercentage: {
    fontSize: 12,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  totalPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  totalPointsText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginLeft: 8,
  },
  currentStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  streakContainer: {
    alignItems: 'center',
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#666666',
    marginBottom: 8,
  },
  streakValue: {
    fontSize: 36,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  streakUnit: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  achievementStatsContainer: {
    flexDirection: 'row',
    flex: 1.5,
    justifyContent: 'space-around',
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(0, 0, 0, 0.1)',
    paddingLeft: 16,
  },
  achievementStat: {
    alignItems: 'center',
  },
  achievementStatValue: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    color: '#000000',
  },
  achievementStatLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
  },
  nextAchievementCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  nextAchievementTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 16,
  },
  pointSourcesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  pointSourcesTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 16,
  },
  pointSourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  pointSourceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pointSourceInfo: {
    flex: 1,
  },
  pointSourceName: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#000000',
  },
  pointSourceDescription: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#666666',
  },
  pointSourceValue: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  allAchievementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  allAchievementsTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 16,
  },
  achievementItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  achievementUnlocked: {
    opacity: 1,
  },
  achievementNext: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 8,
    margin: -8,
    padding: 8,
  },
  achievementIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  achievementTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  achievementTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    flex: 1,
  },
  achievementTitleLocked: {
    color: '#666666',
  },
  unlockedBadge: {
    backgroundColor: '#4CAF50',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginBottom: 4,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pointsText: {
    fontSize: 13,
    fontFamily: typography.fonts.medium,
    color: '#FFD700',
    marginLeft: 4,
  },
  pointsTextLocked: {
    color: '#AAAAAA',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#CCCCCC',
    borderRadius: 3,
  },
  daysRemaining: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  achievementRecent: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    margin: -8,
    padding: 8,
  },
  newBadge: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  newBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: typography.fonts.bold,
  },
  congratsContainer: {
    marginTop: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderLeftWidth: 2,
    borderLeftColor: '#4CAF50',
  },
  congratsText: {
    color: '#4CAF50',
    fontSize: 12,
    fontFamily: typography.fonts.medium,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AchievementsScreen; 