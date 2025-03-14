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
  Modal,
  TextInput
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
  interpolate,
  Easing,
  useAnimatedProps
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieAnimation from '../../src/components/LottieAnimation';
import ConfettiAnimation from '../../src/components/ConfettiAnimation';
import FlipClock from '../../src/components/FlipClock';
import SecondsFlipClock from '../../src/components/SecondsFlipClock';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import TimerDisplay from '../../src/components/TimerDisplay';
import Svg, { Circle, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.35;
const STROKE_WIDTH = 8;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

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
      <StatusBar barStyle="dark-content" />
      
      {/* White background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{backgroundColor: '#FFFFFF', flex: 1}} />
      </View>
      
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
              colors={['#4CAF50', '#388E3C']}
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
                  <Ionicons name="brain" size={24} color="#4CAF50" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Improved mental clarity and cognitive function
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="heart" size={24} color="#4CAF50" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Better physical health and respiratory function
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="cash" size={24} color="#4CAF50" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Financial savings that add up over time
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="people" size={24} color="#4CAF50" style={styles.pledgeIcon} />
                  <Text style={styles.pledgeText}>
                    Stronger relationships and social connections
                  </Text>
                </View>
                
                <View style={styles.pledgePoint}>
                  <Ionicons name="trophy" size={24} color="#4CAF50" style={styles.pledgeIcon} />
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
                      colors={['#4CAF50', '#388E3C', '#2E7D32', '#1B5E20', '#4CAF50']}
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
        {/* Timer Label - Above Timer */}
        <Text style={[styles.timerLabel, { marginTop: insets.top + 60, marginBottom: 16 }]}>
          You've been cannabis-free for:
        </Text>
        
        {/* Timer Display */}
        <View style={styles.timerContainer}>
          <View style={styles.timeValues}>
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{timeElapsed.hours}</Text>
              <Text style={styles.timeLabel}>hours</Text>
            </View>
            
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{timeElapsed.minutes}</Text>
              <Text style={styles.timeLabel}>minutes</Text>
            </View>
            
            <View style={styles.timeUnit}>
              <Text style={styles.timeValue}>{timeElapsed.seconds}</Text>
              <Text style={styles.timeLabel}>seconds</Text>
            </View>
          </View>
          
          <View style={styles.circleContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
              {/* Background Circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
                stroke="#E8F5E9"
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              
              {/* Progress Circle */}
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
                stroke="#4CAF50"
                strokeWidth={STROKE_WIDTH}
                strokeLinecap="round"
                fill="transparent"
                strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)}`}
                strokeDashoffset={timeElapsed.seconds * (2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)) / 60}
                transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
              />
              
              {/* Center Icon */}
              <View style={styles.centerIcon}>
                <Ionicons name="refresh" size={24} color="#4CAF50" />
              </View>
            </Svg>
          </View>
        </View>
        
        {/* Motivational Text */}
        <View style={styles.motivationalContainer}>
          <Ionicons name="leaf" size={16} color="#4CAF50" style={styles.leafIcon} />
          <Text style={styles.motivationalText}>Keep going, you're doing great!</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => handleButtonPress('meditate')}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="leaf" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.buttonText}>Meditate</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => handleButtonPress('pledge')}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="heart" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.buttonText}>Pledge</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => handleButtonPress('journal')}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="book" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.buttonText}>Journal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            activeOpacity={0.8}
            onPress={() => handleButtonPress('more')}
          >
            <View style={styles.buttonIconContainer}>
              <Ionicons name="grid" size={26} color="#4CAF50" />
            </View>
            <Text style={styles.buttonText}>More</Text>
          </TouchableOpacity>
        </View>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Money Saved</Text>
            <Text style={styles.statValue}>$120</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <Text style={styles.statValue}>7 days</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
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
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginLeft: 8,
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginHorizontal: 20,
    letterSpacing: 0.5,
  },
  timerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  timeValues: {
    flex: 1,
    marginRight: 20,
  },
  timeUnit: {
    marginBottom: 20,
  },
  timeValue: {
    fontSize: 80,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    lineHeight: 80,
  },
  timeLabel: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.regular,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
  },
  centerIcon: {
    position: 'absolute',
    top: CIRCLE_SIZE / 2 - 12,
    left: CIRCLE_SIZE / 2 - 12,
  },
  motivationalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  leafIcon: {
    marginRight: 8,
  },
  motivationalText: {
    fontSize: 16,
    color: '#666666',
    fontFamily: typography.fonts.medium,
  },
  buttonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 0,
    marginTop: 20,
    marginHorizontal: 10,
  },
  actionButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
  },
  buttonIconContainer: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: 'rgba(76, 175, 80, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    fontSize: 15,
    color: '#333333',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 6,
  },
  statLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    color: '#000000',
    fontFamily: typography.fonts.bold,
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
    paddingTop: '15%',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '95%',
    maxHeight: '85%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.3)',
  },
  modalTitle: {
    fontSize: 22,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  modalCloseButton: {
    padding: 8,
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
    color: '#333333',
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
    color: '#666666',
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
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.3)',
    width: '100%',
  },
});

export default MainScreen; 