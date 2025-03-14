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
import Svg, { Circle, Path, G, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.55;
const STROKE_WIDTH = 14;
const PULSE_DURATION = 2000;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const logoScale = useSharedValue(1);

  // Timer State
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // UI State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  
  // Animation values
  const rainbowAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);
  const refreshIconRotation = useSharedValue(0);
  const pulseAnimation = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);
  const refreshButtonScale = useSharedValue(1);
  const timeValueOpacity = useSharedValue(1);
  const meditateButtonScale = useSharedValue(1);
  const pledgeButtonScale = useSharedValue(1);
  const journalButtonScale = useSharedValue(1);
  const moreButtonScale = useSharedValue(1);
  
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

  // Start pulse animation for the circle
  useEffect(() => {
    pulseAnimation.value = 0;
    pulseAnimation.value = withRepeat(
      withTiming(1, { 
        duration: PULSE_DURATION,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1, // Infinite repeat
      true // Reverse
    );
    
    glowOpacity.value = withRepeat(
      withTiming(0.6, { 
        duration: PULSE_DURATION * 1.5,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      -1, // Infinite repeat
      true // Reverse
    );
  }, []);

  // Format time for display
  const formatTime = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };
  
  // Get formatted time units based on elapsed time
  const getFormattedTimeUnits = () => {
    const totalSeconds = timeElapsed.seconds;
    const totalMinutes = timeElapsed.minutes;
    const totalHours = timeElapsed.hours;
    const totalDays = timeElapsed.days;
    
    // Less than 1 minute: show only seconds
    if (totalMinutes === 0 && totalHours === 0 && totalDays === 0) {
      return [
        {
          value: formatTime(totalSeconds),
          label: 'seconds'
        }
      ];
    }
    
    // Less than 1 hour: show minutes and seconds
    if (totalHours === 0 && totalDays === 0) {
      return [
        {
          value: formatTime(totalMinutes),
          label: 'minutes'
        },
        {
          value: formatTime(totalSeconds),
          label: 'seconds'
        }
      ];
    }
    
    // Less than 24 hours: show hours, minutes, seconds
    if (totalDays === 0) {
      return [
        {
          value: formatTime(totalHours),
          label: 'hours'
        },
        {
          value: formatTime(totalMinutes),
          label: 'minutes'
        },
        {
          value: formatTime(totalSeconds),
          label: 'seconds'
        }
      ];
    }
    
    // Less than 7 days: show days, hours, minutes
    if (totalDays < 7) {
      return [
        {
          value: totalDays,
          label: 'days'
        },
        {
          value: formatTime(totalHours),
          label: 'hours'
        },
        {
          value: formatTime(totalMinutes),
          label: 'minutes'
        }
      ];
    }
    
    // Less than 30 days: show weeks, days, hours
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    
    if (totalDays < 30) {
      return [
        {
          value: weeks,
          label: 'weeks'
        },
        {
          value: remainingDays,
          label: 'days'
        },
        {
          value: formatTime(totalHours),
          label: 'hours'
        }
      ];
    }
    
    // Less than 365 days: show months, weeks, days
    const months = Math.floor(totalDays / 30);
    const remainingWeeks = Math.floor((totalDays % 30) / 7);
    
    if (totalDays < 365) {
      return [
        {
          value: months,
          label: 'months'
        },
        {
          value: remainingWeeks,
          label: 'weeks'
        },
        {
          value: remainingDays % 7,
          label: 'days'
        }
      ];
    }
    
    // More than 365 days: show years, months, weeks
    const years = Math.floor(totalDays / 365);
    const remainingMonths = Math.floor((totalDays % 365) / 30);
    
    return [
      {
        value: years,
        label: 'years'
      },
      {
        value: remainingMonths,
        label: 'months'
      },
      {
        value: remainingWeeks,
        label: 'weeks'
      }
    ];
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
      
      const totalSeconds = Math.floor(elapsedMs / 1000);
      const totalMinutes = Math.floor(totalSeconds / 60);
      const totalHours = Math.floor(totalMinutes / 60);
      const totalDays = Math.floor(totalHours / 24);
      
      const seconds = totalSeconds % 60;
      const minutes = totalMinutes % 60;
      const hours = totalHours % 24;
      const days = totalDays;
      
      setTimeElapsed({ days, hours, minutes, seconds });
      
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
          
          const totalSeconds = Math.floor(elapsedMs / 1000);
          const totalMinutes = Math.floor(totalSeconds / 60);
          const totalHours = Math.floor(totalMinutes / 60);
          const totalDays = Math.floor(totalHours / 24);
          
          const seconds = totalSeconds % 60;
          const minutes = totalMinutes % 60;
          const hours = totalHours % 24;
          const days = totalDays;
          
          setTimeElapsed({ days, hours, minutes, seconds });
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

  // Update time values with animation
  useEffect(() => {
    // Flash animation for time values when seconds change
    timeValueOpacity.value = 0.7;
    timeValueOpacity.value = withTiming(1, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Update progress animation
    progressAnimation.value = withTiming(timeElapsed.seconds / 60, {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [timeElapsed.seconds]);
  
  // Rotate refresh icon on press
  const handleRefreshPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    refreshIconRotation.value = withTiming(refreshIconRotation.value + 360, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    
    // Call the reset handler
    handleReset();
  };
  
  // Handle refresh button press in
  const handleRefreshPressIn = () => {
    refreshButtonScale.value = withSpring(0.9, {
      damping: 12,
      stiffness: 220,
    });
  };
  
  // Handle refresh button press out
  const handleRefreshPressOut = () => {
    refreshButtonScale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };
  
  // Animated style for refresh icon
  const refreshIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${refreshIconRotation.value}deg` }]
    };
  });
  
  // Animated style for refresh button
  const refreshButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: refreshButtonScale.value }]
    };
  });
  
  // Animated props for the progress circle
  const progressCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2);
    return {
      strokeDashoffset: circumference * (1 - progressAnimation.value),
    };
  });
  
  // Animated style for the pulse effect
  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(
        pulseAnimation.value,
        [0, 1],
        [1, 1.05]
      )}],
      opacity: interpolate(
        pulseAnimation.value,
        [0, 1],
        [1, 0.8]
      )
    };
  });
  
  // Animated style for the glow effect
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value
    };
  });

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/relapse');
  };

  const handleButtonPress = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add button press animation based on type
    let buttonScale;
    if (type === 'meditate') {
      buttonScale = meditateButtonScale;
      router.push('/(standalone)/meditate');
    } else if (type === 'pledge') {
      buttonScale = pledgeButtonScale;
      router.push('/(standalone)/pledge');
    } else if (type === 'journal') {
      buttonScale = journalButtonScale;
      router.push({
        pathname: '/(main)/recovery',
        params: { initialTab: 'journal' }
      });
    } else if (type === 'more') {
      buttonScale = moreButtonScale;
      // Handle more options
    }
    
    // Animate the button with a more pronounced effect
    buttonScale.value = withSpring(0.92, { 
      damping: 8, 
      stiffness: 300,
      mass: 0.5
    }, () => {
      buttonScale.value = withSpring(1, { 
        damping: 12, 
        stiffness: 200,
        mass: 0.8
      });
    });
    
    logoScale.value = withSpring(1.1, { damping: 10, stiffness: 100 }, () => {
      logoScale.value = withSpring(1);
    });
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

  // Animated style for time values
  const timeValueStyle = useAnimatedStyle(() => {
    return {
      opacity: timeValueOpacity.value
    };
  });

  // Animated styles for action buttons
  const meditateButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: meditateButtonScale.value }]
    };
  });
  
  const pledgeButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pledgeButtonScale.value }]
    };
  });
  
  const journalButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: journalButtonScale.value }]
    };
  });
  
  const moreButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: moreButtonScale.value }]
    };
  });

  // Calculate brain rewiring progress (0-100%)
  const calculateBrainProgress = () => {
    // 90 days in total for 100% brain rewiring
    const totalDays = 90;
    const currentDays = timeElapsed.days;
    
    // Cap at 100%
    const progress = Math.min(currentDays / totalDays, 1) * 100;
    return Math.floor(progress);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Off-white background instead of pure white */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#F8F9FA'}} />
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
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.logoContainer}>
          <Animated.Image 
            source={require('../../assets/images/broccoli-logo.png')}
            style={[styles.logo, logoAnimatedStyle]}
          />
          <Text style={styles.logoText}>BROCCOLI</Text>
        </View>
      </View>
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70, paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Timer Display - Removed white box container */}
        <View style={styles.timerContainer}>
          {/* Circle Progress */}
          <View style={styles.circleWrapper}>
            <Animated.View style={[styles.circleContainer, pulseStyle]}>
              <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={styles.svg}>
                <Defs>
                  <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#4CAF50" stopOpacity="1" />
                    <Stop offset="50%" stopColor="#2E7D32" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#1B5E20" stopOpacity="1" />
                  </SvgGradient>
                  <SvgGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#D7EAD9" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#B7D9B9" stopOpacity="0.8" />
                  </SvgGradient>
                  <SvgGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
                    <Stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                  </SvgGradient>
                  <SvgGradient id="buttonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#F8F8F8" stopOpacity="1" />
                  </SvgGradient>
                  <SvgGradient id="resetButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                    <Stop offset="100%" stopColor="#F5F5F5" stopOpacity="1" />
                  </SvgGradient>
                </Defs>
                
                {/* Outer glow effect with animation */}
                <Animated.View style={glowStyle}>
                  <Circle
                    cx={CIRCLE_SIZE / 2}
                    cy={CIRCLE_SIZE / 2}
                    r={(CIRCLE_SIZE - STROKE_WIDTH) / 2 + 10}
                    stroke="url(#glowGradient)"
                    strokeWidth={20}
                    fill="transparent"
                  />
                </Animated.View>
                
                {/* Background Circle with subtle gradient */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
                  stroke="url(#bgGradient)"
                  strokeWidth={STROKE_WIDTH}
                  fill="transparent"
                  strokeLinecap="round"
                />
                
                {/* Progress Circle with gradient */}
                <AnimatedCircle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
                  stroke="url(#progressGradient)"
                  strokeWidth={STROKE_WIDTH}
                  strokeLinecap="round"
                  fill="transparent"
                  strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)}`}
                  animatedProps={progressCircleProps}
                  transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
                />
                
                {/* Center button shadow */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={STROKE_WIDTH * 1.85}
                  fill="rgba(0, 0, 0, 0.03)"
                  stroke="transparent"
                />
                
                {/* Center Icon Container with improved design */}
                <Circle
                  cx={CIRCLE_SIZE / 2}
                  cy={CIRCLE_SIZE / 2}
                  r={STROKE_WIDTH * 1.8}
                  fill="url(#resetButtonGradient)"
                  stroke="rgba(76, 175, 80, 0.2)"
                  strokeWidth={1}
                />
              </Svg>
              
              {/* Center Icon with Animation */}
              <TouchableOpacity 
                style={styles.refreshButton}
                onPress={handleRefreshPress}
                onPressIn={handleRefreshPressIn}
                onPressOut={handleRefreshPressOut}
                activeOpacity={0.9}
              >
                <Animated.View style={[refreshIconStyle, refreshButtonStyle]}>
                  <Ionicons name="refresh" size={22} color="#4CAF50" />
                </Animated.View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          {/* Timer Label */}
          <Text style={styles.timerLabel}>
            You've been cannabis-free for:
          </Text>
          
          {/* Horizontal Time Units */}
          <View style={styles.horizontalTimeRow}>
            {(() => {
              const timeUnits = getFormattedTimeUnits();
              return (
                <>
                  {timeUnits.map((unit, index) => (
                    <View key={unit.label} style={styles.timeUnit}>
                      <View style={styles.timeValueContainer}>
                        <Animated.Text style={[styles.timeValue, timeValueStyle]}>
                          {unit.value}
                        </Animated.Text>
                      </View>
                      <Text style={styles.timeLabel}>{unit.label}</Text>
                    </View>
                  ))}
                </>
              );
            })()}
          </View>
        </View>
        
        {/* Brain Rewiring Progress Bar */}
        <View style={styles.brainProgressContainer}>
          <TouchableOpacity
            style={styles.brainProgressCard}
            activeOpacity={0.9}
          >
            <View style={styles.brainProgressHeader}>
              <Text style={styles.brainProgressTitle}>Brain Healing</Text>
              <Text style={styles.brainProgressPercent}>{calculateBrainProgress()}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${calculateBrainProgress()}%` }
                  ]} 
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Quick Actions Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.buttonGrid}>
          <View style={styles.buttonRow}>
            <Animated.View style={[meditateButtonStyle, styles.buttonWrapper]}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => handleButtonPress('meditate')}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="leaf-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.buttonText}>Meditate</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[pledgeButtonStyle, styles.buttonWrapper]}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => handleButtonPress('pledge')}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="heart-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.buttonText}>Pledge</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
          
          <View style={styles.buttonRow}>
            <Animated.View style={[journalButtonStyle, styles.buttonWrapper]}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => handleButtonPress('journal')}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="book-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.buttonText}>Journal</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            </Animated.View>
            
            <Animated.View style={[moreButtonStyle, styles.buttonWrapper]}>
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.7}
                onPress={() => handleButtonPress('more')}
              >
                <View style={styles.buttonIconContainer}>
                  <Ionicons name="grid-outline" size={20} color="#4CAF50" />
                </View>
                <Text style={styles.buttonText}>More</Text>
                <View style={styles.buttonArrow}>
                  <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Panic Button */}
      <TouchableOpacity 
        style={[styles.panicButton, { bottom: insets.bottom + 70 }]} 
        activeOpacity={0.7}
        onPress={handlePanicButtonPress}
      >
        <View style={styles.panicButtonInner}>
          <Ionicons name="alert-circle" size={18} color="#FF3B30" style={styles.panicIcon} />
          <Text style={styles.panicButtonText}>PANIC BUTTON</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 150,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 10,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  logo: {
    width: 38,
    height: 38,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginLeft: 10,
    letterSpacing: 1,
  },
  timerContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  timerLabel: {
    fontSize: 14,
    color: '#555555',
    fontFamily: typography.fonts.medium,
    marginTop: 32,
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  horizontalTimeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 10,
  },
  timeUnit: {
    alignItems: 'center',
    marginHorizontal: 12,
    minWidth: 80,
    position: 'relative',
  },
  timeValueContainer: {
    position: 'relative',
    alignSelf: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    minWidth: 90,
    alignItems: 'center',
    paddingHorizontal: 5,
    paddingVertical: 4,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  timeValue: {
    fontSize: 68,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    lineHeight: 76,
    letterSpacing: -1,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    textAlign: 'center',
  },
  timeLabel: {
    fontSize: 14,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    marginBottom: 0,
  },
  circleContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  svg: {
    position: 'absolute',
  },
  refreshButton: {
    width: STROKE_WIDTH * 3.6,
    height: STROKE_WIDTH * 3.6,
    borderRadius: STROKE_WIDTH * 1.8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    marginBottom: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: '#333333',
    marginLeft: 5,
  },
  buttonGrid: {
    marginBottom: 20,
    marginHorizontal: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  buttonWrapper: {
    width: '48.5%',
  },
  actionButton: {
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  buttonIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  buttonText: {
    fontSize: 15,
    color: '#333333',
    fontFamily: typography.fonts.medium,
    flex: 1,
  },
  buttonArrow: {
    marginLeft: 'auto',
    paddingRight: 2,
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
  panicButton: {
    position: 'absolute',
    left: 50,
    right: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 59, 48, 0.08)',
    borderWidth: 2,
    borderColor: '#FF3B30',
    shadowColor: 'rgba(255, 59, 48, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  panicButtonInner: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  panicIcon: {
    marginRight: 10,
  },
  panicButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  brainProgressContainer: {
    marginBottom: 25,
    paddingHorizontal: 5,
  },
  brainProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
  },
  brainProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brainProgressTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.semibold,
    color: '#333333',
  },
  brainProgressPercent: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 12,
    width: '100%',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 6,
  },
});

export default MainScreen; 