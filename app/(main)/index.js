import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ScrollView, 
  Image, 
  Dimensions,
  Platform,
  StatusBar,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withRepeat,
  interpolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieAnimation from '../../src/components/LottieAnimation';
import ConfettiAnimation from '../../src/components/ConfettiAnimation';
import FlipClock from '../../src/components/FlipClock';
import SecondsFlipClock from '../../src/components/SecondsFlipClock';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const logoScale = useSharedValue(1);

  // Timer State
  const [timeElapsed, setTimeElapsed] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // UI State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  
  // Animation values for rainbow button
  const rainbowAnimation = useSharedValue(0);
  
  // Start rainbow animation when modal is shown
  useEffect(() => {
    if (showPledgeModal) {
      rainbowAnimation.value = 0;
      rainbowAnimation.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1, // Infinite repeat
        false // No reverse
      );
    }
  }, [showPledgeModal]);

  // Format time for display
  const formatTime = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };
  
  // Format time for human-readable display
  const formatTimeForDisplay = () => {
    let formattedTime = '';
    
    if (timeElapsed.days > 0) {
      formattedTime += `${timeElapsed.days}d `;
    }
    
    if (timeElapsed.hours > 0 || timeElapsed.days > 0) {
      formattedTime += `${timeElapsed.hours}h `;
    }
    
    formattedTime += `${timeElapsed.minutes}m`;
    
    return formattedTime;
  };
  
  // Determine if we should show seconds separately
  const shouldShowSecondsOnly = () => {
    return timeElapsed.hours === 0 && timeElapsed.minutes === 0;
  };
  
  // Determine if we should show seconds as a smaller box
  const shouldShowSecondsBox = () => {
    return timeElapsed.hours === 0 || timeElapsed.minutes > 0;
  };
  
  // Initialize timer
  const initializeTimer = async () => {
    try {
      const startTimeStr = await AsyncStorage.getItem('streakStartTime');
      if (!startTimeStr) {
        router.replace('/(standalone)/start-streak');
        return null;
      }
      
      const startTime = parseInt(startTimeStr, 10);
      const currentTime = new Date().getTime();
      const elapsedMs = currentTime - startTime;
      
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      setTimeElapsed({ hours, minutes, seconds });
      
      return startTime;
    } catch (error) {
      console.error('Error initializing timer:', error);
      return null;
    }
  };

  useEffect(() => {
    let timerInterval;
    
    const setupTimer = async () => {
      const startTime = await initializeTimer();
      
      if (startTime) {
        timerInterval = setInterval(() => {
          const currentTime = new Date().getTime();
          const elapsedMs = currentTime - startTime;
          
          const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
          const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
          
          setTimeElapsed({ hours, minutes, seconds });
        }, 1000);
      }
    };
    
    setupTimer();
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, []);

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/relapse');
  };

  const handleButtonPress = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    logoScale.value = withSpring(1.1, { damping: 10, stiffness: 100 }, () => {
      logoScale.value = withSpring(1);
    });
    
    if (type === 'meditate') {
      router.push('/(standalone)/meditate');
    } else if (type === 'pledge') {
      // Navigate to the pledge screen instead of showing the modal
      router.push('/(standalone)/pledge');
    } else if (type === 'journal') {
      // Navigate to recovery page with journal tab active
      router.push({
        pathname: '/(main)/recovery',
        params: { initialTab: 'journal' }
      });
    } else if (type === 'more') {
      // Handle more options
    }
  };

  // Handle pledge confirmation
  const handlePledgeConfirm = () => {
    // Close the modal
    setShowPledgeModal(false);
    
    // Hide confetti first (if it's already showing)
    setShowConfetti(false);
    
    // Use setTimeout to ensure state updates before showing again
    setTimeout(() => {
      // Generate a new key to force animation to replay
      setConfettiKey(prevKey => prevKey + 1);
      
      // Show confetti animation
      setShowConfetti(true);
      
      // Provide haptic feedback for confirmation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 50);
  };

  // Handle when confetti animation finishes
  const handleConfettiFinish = () => {
    setShowConfetti(false);
  };

  const handlePanicButtonPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(standalone)/panic');
  };

  // Fixed scroll handler - using a regular function instead of useAnimatedScrollHandler
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.value = offsetY;
  };

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }]
    };
  });

  // Rainbow button animation style
  const rainbowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: interpolate(
        rainbowAnimation.value,
        [0, 1],
        [-200, 200]
      )}]
    };
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced green gradient background */}
      <LinearGradient
        colors={['#143C25', '#1A5032', '#143C25']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Pledge Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showPledgeModal}
        onRequestClose={() => setShowPledgeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header with Gradient */}
            <LinearGradient
              colors={['#4FA65B', '#45925A']}
              style={styles.modalHeaderGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>PLEDGE YOUR SOBRIETY</Text>
                <Pressable 
                  onPress={() => setShowPledgeModal(false)} 
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close-circle" size={28} color="#FFFFFF" />
                </Pressable>
              </View>
            </LinearGradient>
            
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.pledgeSection}>
                <Text style={styles.pledgeTitle}>
                  Why Sobriety Matters
                </Text>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="brain" size={24} color="#5BBD68" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Improved mental clarity and cognitive function
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="heart" size={24} color="#5BBD68" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Better physical health and respiratory function
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="cash" size={24} color="#5BBD68" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Financial savings that add up over time
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="people" size={24} color="#5BBD68" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Stronger relationships and social connections
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="trophy" size={24} color="#5BBD68" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Sense of accomplishment and self-control
                  </Text>
                </View>
              </View>
              
              <Animated.View style={styles.pledgeButtonContainer}>
                <TouchableOpacity 
                  style={styles.pledgeButton} 
                  activeOpacity={0.7}
                  onPress={handlePledgeConfirm}
                >
                  <Animated.View style={[StyleSheet.absoluteFill, rainbowAnimatedStyle]}>
                    <LinearGradient
                      colors={['#FF5F6D', '#FFC371', '#4FA65B', '#00C9FF', '#9D50BB', '#FF5F6D']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: 400, height: '100%' }}
                    />
                  </Animated.View>
                  <Text style={styles.pledgeButtonText}>PLEDGE NOW</Text>
                </TouchableOpacity>
              </Animated.View>
            </ScrollView>
          </View>
        </View>
      </Modal>
      
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiAnimation 
          animationKey={confettiKey} 
          onAnimationFinish={handleConfettiFinish} 
        />
      )}
      
      {/* Header with Logo in top left */}
      <View style={[styles.headerContainer, { top: insets.top + 10 }]}>
        <View style={styles.logoContainer}>
          <Animated.Image 
            source={require('../../assets/images/broccoli-logo.png')}
            style={[styles.logo, logoAnimatedStyle]}
          />
          <Text style={styles.logoText}>BROCCOLI</Text>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Lottie Animation - Now at the top */}
        <View style={[styles.animationContainer, { marginTop: insets.top + 55 }]}>
          <LottieAnimation />
        </View>
        
        {/* Timer Section */}
        <View style={styles.timerSection}>
          <Text style={styles.timerLabel}>You've been cannabis-free for:</Text>
          
          <View style={styles.timerDisplay}>
            {/* Main Timer Display */}
            {!shouldShowSecondsOnly() ? (
              <Text style={styles.humanReadableTime}>{formatTimeForDisplay()}</Text>
            ) : (
              <Text style={styles.largeSecondsText}>{timeElapsed.seconds}</Text>
            )}
            
            {/* Seconds Box (shown only when not in seconds-only mode) */}
            {!shouldShowSecondsOnly() && shouldShowSecondsBox() && (
              <View style={styles.secondsBoxContainer}>
                <SecondsFlipClock seconds={timeElapsed.seconds} />
              </View>
            )}
          </View>
          
          <View style={styles.timerSubLabel}>
            <Ionicons name="leaf" size={14} color="#5BBD68" style={styles.leafIcon} />
            <Text style={styles.timerLabelText}>Keep going, you're doing great!</Text>
          </View>
          
          {/* Reset Button */}
          <Pressable 
            style={({ pressed }) => [
              styles.resetButton,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleReset}
          >
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.3)', 'rgba(79, 166, 91, 0.15)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <BlurView intensity={20} tint="dark" style={styles.resetButtonBlur}>
              <Text style={styles.resetButtonText}>Reset Timer</Text>
            </BlurView>
          </Pressable>
        </View>
        
        {/* Action Buttons - Fixed rounded corners */}
        <View style={styles.buttonContainer}>
          {['meditate', 'pledge', 'journal', 'more'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.actionButton}
              activeOpacity={0.8}
              onPress={() => handleButtonPress(type)}
            >
              <LinearGradient
                colors={['rgba(79, 166, 91, 0.4)', 'rgba(79, 166, 91, 0.2)']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <Ionicons 
                name={
                  type === 'meditate' ? 'leaf' : 
                  type === 'pledge' ? 'heart' : 
                  type === 'journal' ? 'book' : 'grid'
                } 
                size={24} 
                color="#5BBD68" 
              />
              <Text style={styles.buttonText}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Stats Cards - Refined with depth */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
              style={[StyleSheet.absoluteFill, styles.cardGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Text style={styles.statLabel}>Money Saved</Text>
            <Text style={styles.statValue}>$120</Text>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
              style={[StyleSheet.absoluteFill, styles.cardGradient]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>7 days</Text>
          </View>
        </View>
        
        {/* Reason Card - Refined with depth */}
        <View style={styles.reasonCard}>
          <LinearGradient
            colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.05)']}
            style={[StyleSheet.absoluteFill, styles.cardGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={styles.reasonPrompt}>Your reason for quitting:</Text>
          <Text style={styles.reasonText}>"To improve my mental clarity and save money for travel."</Text>
          
          <View style={styles.streakContainer}>
            <Ionicons name="trophy" size={18} color="#FFD700" />
            <Text style={styles.bestStreak}>Current streak: 3 days</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Panic Button */}
      <TouchableOpacity 
        style={[styles.panicButton, { bottom: insets.bottom + 80 }]} 
        activeOpacity={0.9}
        onPress={handlePanicButtonPress}
      >
        <LinearGradient
          colors={['#FF3B30', '#CC2D25']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="alert-circle" size={18} color="#FFF" style={styles.panicIcon} />
        <Text style={styles.panicButtonText}>PANIC BUTTON</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#143C25',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 200, // Increased padding for tab bar and panic button
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: 20,
    position: 'absolute',
    left: 0,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 35,
    height: 35,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginLeft: 8,
    letterSpacing: 1,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 190,
    marginBottom: 10,
    width: '100%',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
    width: '100%',
  },
  timerDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
    width: '100%',
  },
  timerLabel: {
    fontSize: 15,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    marginBottom: 2,
    opacity: 1.5,
  },
  humanReadableTime: {
    fontSize: 46,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(91, 189, 104, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 4,
  },
  largeSecondsText: {
    fontSize: 60,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    textShadowColor: 'rgba(91, 189, 104, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  secondsBoxContainer: {
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ scale: 0.8 }],
  },
  timerSubLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  leafIcon: {
    marginRight: 6,
  },
  timerLabelText: {
    fontSize: 14,
    color: colors.text.secondary,
    fontFamily: typography.fonts.medium,
  },
  resetButton: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 10,
    width: '70%',
  },
  resetButtonBlur: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 15,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    marginHorizontal: -6, // Negative margin to offset button padding
  },
  actionButton: {
    width: (width - 72) / 4,
    aspectRatio: 1,
    borderRadius: 20,
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    overflow: 'hidden',
    backgroundColor: 'rgba(20, 60, 37, 0.7)',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 12,
    marginTop: 8,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 20,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24, // Reduced from 28
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  reasonCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    position: 'relative',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reasonPrompt: {
    fontSize: 15,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  reasonText: {
    fontSize: 16, // Reduced from 18
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    marginBottom: 20,
    fontStyle: 'italic',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bestStreak: {
    fontSize: 15,
    color: colors.text.primary,
    marginLeft: 8,
  },
  panicButton: {
    position: 'absolute',
    left: 50,
    right: 50,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    overflow: 'hidden',
  },
  panicIcon: {
    marginRight: 8,
    fontSize: 18,
  },
  panicButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: '15%', // Leave top 15% of screen uncovered
  },
  modalContent: {
    backgroundColor: '#143C25',
    borderRadius: 20,
    width: '95%',
    maxHeight: '85%', // Take up 85% of screen height
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
    shadowColor: '#5BBD68',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(91, 189, 104, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  modalCloseButton: {
    padding: 8,
    marginLeft: 12,
  },
  modalScrollView: {
    maxHeight: '75%',
  },
  modalScrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  pledgeSection: {
    marginBottom: 30,
  },
  pledgeTitle: {
    fontSize: 28,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 24,
    textAlign: 'center',
  },
  pledgePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  pledgeIcon: {
    marginRight: 16,
  },
  pledgeText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    lineHeight: 22,
  },
  pledgeButtonContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  pledgeButton: {
    borderRadius: 30,
    height: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 6,
  },
  pledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 166, 91, 0.3)',
    width: '100%',
  },
});

export default MainScreen; 