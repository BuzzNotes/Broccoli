import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  TextInput,
  ActivityIndicator,
  Alert,
  AppState
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
import { auth, db } from '../../src/config/firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { awardDailyLoginPoints } from '../../src/utils/achievementUtils';
import { isFirebaseInitialized } from '../../src/utils/firebaseCheck';
import ConfettiCannon from 'react-native-confetti-cannon';
import BannerNotification from '../../src/components/BannerNotification';
import { ALL_ACHIEVEMENTS } from '../../src/utils/achievementUtils';
import * as Notifications from 'expo-notifications';
import CelebrationAlert from '../components/CelebrationAlert';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;
const STROKE_WIDTH = 14;
const PULSE_DURATION = 2000;
const PROGRESS_RING_COLOR = '#2E7D32'; // Change to a darker forest green that will stand out against the background
const PROGRESS_RING_WIDTH = 12; // Increase stroke width for better visibility

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const logoScale = useSharedValue(1);
  
  // Add login check state
  const [isCheckingLogin, setIsCheckingLogin] = useState(false);
  
  // Add headerStyle animated style based on scrollY
  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 50],
      [0, 1],
      'clamp'
    );
    
    return {
      backgroundColor: `rgba(255, 255, 255, ${opacity})`,
      shadowOpacity: opacity * 0.3,
      zIndex: 100,
    };
  });
  
  // Add userName state
  const [userName, setUserName] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

  // Point availability states
  const [meditationPointsAvailable, setMeditationPointsAvailable] = useState(true);
  const [journalPointsAvailable, setJournalPointsAvailable] = useState(true);
  const [dailyLoginCooldown, setDailyLoginCooldown] = useState(null);
  const [meditationCooldown, setMeditationCooldown] = useState(null);

  // Timer State
  const [timeElapsed, setTimeElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Store timer interval ref
  const timerIntervalRef = useRef(null);

  // UI State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showTimeAdjustModal, setShowTimeAdjustModal] = useState(false);
  const [adjustedTime, setAdjustedTime] = useState({
    years: '0',
    months: '0',
    weeks: '0',
    days: '0',
    hours: '0',
    minutes: '0'
  });
  
  // Initialize user achievements state
  const [userAchievements, setUserAchievements] = useState([]);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState('info');
  
  // CelebrationAlert state
  const [celebrationAlert, setCelebrationAlert] = useState({
    visible: false,
    title: '',
    message: ''
  });
  
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
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Swipeable view states
  const [showStartDate, setShowStartDate] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const swipeAnim = useSharedValue(0);
  
  // Add a state for relapse history
  const [relapseHistory, setRelapseHistory] = useState([]);

  // Add a separate shared value specifically for the seconds progress
  const secondsProgress = useSharedValue(0);

  // Add state for initial sobriety date
  const [initialSobrietyDate, setInitialSobrietyDate] = useState(null);

  // This function manually updates the secondsProgress value
  const updateSecondsProgress = () => {
    if (timeElapsed && 'seconds' in timeElapsed) {
      // Use withTiming to create smooth animation
      secondsProgress.value = withTiming(timeElapsed.seconds / 60, {
        duration: 950, // Slightly less than 1 second for smooth transition
        easing: Easing.linear
      });
    }
  };

  // Set up a more aggressive timer for the seconds animation
  useEffect(() => {
    // Update immediately
    updateSecondsProgress();
    
    // Set up a dedicated interval just for the ring animation
    const ringAnimationInterval = setInterval(() => {
      updateSecondsProgress();
    }, 1000); // Update every second (sync with timer)
    
    return () => clearInterval(ringAnimationInterval);
  }, [timeElapsed?.seconds]);

  // Update the progressCircleProps to use a simpler calculation
  const progressCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * ((CIRCLE_SIZE) / 2 + 10);
    return {
      strokeDashoffset: circumference * (1 - secondsProgress.value),
    };
  });

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

  // Format time for display - removing the leading zeros
  const formatTime = (value) => {
    return `${value}`;
  };
  
  // Modify the getFormattedTimeUnits function to not use formatTime for small units
  const getFormattedTimeUnits = () => {
    const totalSeconds = timeElapsed.seconds;
    const totalMinutes = timeElapsed.minutes;
    const totalHours = timeElapsed.hours;
    const totalDays = timeElapsed.days;
    
    // Calculate weeks, months, years for display
    const weeks = Math.floor(totalDays / 7);
    const remainingDaysAfterWeeks = totalDays % 7;
    
    const months = Math.floor(totalDays / 30);
    const remainingDaysAfterMonths = totalDays % 30;
    const weeksAfterMonths = Math.floor(remainingDaysAfterMonths / 7);
    const daysAfterWeeksAndMonths = remainingDaysAfterMonths % 7;
    
    const years = Math.floor(totalDays / 365);
    const remainingDaysAfterYears = totalDays % 365;
    const monthsAfterYears = Math.floor(remainingDaysAfterYears / 30);
    const remainingDaysAfterMonths2 = remainingDaysAfterYears % 30;
    const weeksAfterMonthsAndYears = Math.floor(remainingDaysAfterMonths2 / 7);
    const daysAfterAll = remainingDaysAfterMonths2 % 7;
    
    // Create separate arrays for large units and small units
    let largeUnits = [];
    let smallUnits = [];
    
    // CASE 1: Less than 1 day
    if (totalDays === 0) {
      // If less than 1 minute, show hours, minutes, and seconds in large units
      if (totalMinutes === 0) {
        largeUnits = [
          {
            value: totalHours,
            label: totalHours === 1 ? 'hour' : 'hours'
          },
          {
            value: totalMinutes,
            label: totalMinutes === 1 ? 'minute' : 'minutes'
          },
          {
            value: totalSeconds,
            label: totalSeconds === 1 ? 'second' : 'seconds'
          }
        ];
        
        // Filter out zero values only if we have at least one non-zero value
        const nonZeroUnits = largeUnits.filter(unit => unit.value > 0);
        if (nonZeroUnits.length > 0) {
          largeUnits = nonZeroUnits;
        } else {
          // If all units are zero, show at least minutes and seconds
          largeUnits = [
            {
              value: 0,
              label: 'minutes'
            },
            {
              value: 0,
              label: 'seconds'
            }
          ];
        }
        
        // No small units when less than 1 minute
        smallUnits = [];
      } 
      // If 1+ minutes but less than 1 day, show hours and minutes in large units, seconds in small units
      else {
        largeUnits = [
          {
            value: totalHours,
            label: totalHours === 1 ? 'hour' : 'hours'
          },
          {
            value: totalMinutes,
            label: totalMinutes === 1 ? 'minute' : 'minutes'
          }
        ];
        
        // Filter out zero values only if we have at least one non-zero value
        const nonZeroUnits = largeUnits.filter(unit => unit.value > 0);
        if (nonZeroUnits.length > 0) {
          largeUnits = nonZeroUnits;
        } else {
          // This should never happen, but just in case
          largeUnits = [
            {
              value: 0,
              label: 'minutes'
            }
          ];
        }
        
        // Show seconds in the small units (green section)
        smallUnits = [
          {
            value: totalSeconds,
            label: 's'
          }
        ];
      }
      
            return {
        largeUnits,
        smallUnits
      };
    }
    
    // CASE 2: 1+ days but less than 7 days - show days, hours, minutes in large
    if (totalDays < 7) {
      largeUnits = [
        {
          value: totalDays,
          label: totalDays === 1 ? 'day' : 'days'
        },
        {
          value: totalHours,
          label: totalHours === 1 ? 'hour' : 'hours'
        },
        {
          value: totalMinutes,
          label: totalMinutes === 1 ? 'minute' : 'minutes'
        }
      ];
      
      smallUnits = [
        {
          value: timeElapsed.seconds,
          label: 's'
        }
      ];
      
          return {
        largeUnits,
        smallUnits
      };
    }
    
    // CASE 3: 1+ weeks but less than 30 days - show weeks, days, hours in large
    if (totalDays < 30) {
      largeUnits = [
        {
          value: weeks,
          label: weeks === 1 ? 'week' : 'weeks'
        },
        {
          value: remainingDaysAfterWeeks,
          label: remainingDaysAfterWeeks === 1 ? 'day' : 'days'
        },
        {
          value: totalHours,
          label: totalHours === 1 ? 'hour' : 'hours'
        }
      ];
      
      smallUnits = [
        {
          value: timeElapsed.minutes,
          label: 'm'
        },
        {
          value: timeElapsed.seconds,
          label: 's'
        }
      ];
      
        return {
        largeUnits,
        smallUnits
      };
    }
    
    // CASE 4: 1+ months but less than 365 days - show months, weeks, days in large
    if (totalDays < 365) {
      largeUnits = [
        {
          value: months,
          label: months === 1 ? 'month' : 'months'
        },
        {
          value: weeksAfterMonths,
          label: weeksAfterMonths === 1 ? 'week' : 'weeks'
        },
        {
          value: daysAfterWeeksAndMonths,
          label: daysAfterWeeksAndMonths === 1 ? 'day' : 'days'
        }
      ];
      
      smallUnits = [
        {
          value: timeElapsed.hours,
          label: 'h'
        },
        {
          value: timeElapsed.minutes,
          label: 'm'
        },
        {
          value: timeElapsed.seconds,
          label: 's'
        }
      ];
      
      return {
        largeUnits,
        smallUnits
      };
    }
    
    // CASE 5: 1+ years - show years, months, weeks in large
    largeUnits = [
      {
        value: years,
        label: years === 1 ? 'year' : 'years'
      },
      {
        value: monthsAfterYears,
        label: monthsAfterYears === 1 ? 'month' : 'months'
      },
      {
        value: weeksAfterMonthsAndYears,
        label: weeksAfterMonthsAndYears === 1 ? 'week' : 'weeks'
      }
    ];
    
    smallUnits = [
      {
        value: daysAfterAll,
        label: 'd'
      },
      {
        value: timeElapsed.hours,
        label: 'h'
      },
      {
        value: timeElapsed.minutes,
        label: 'm'
      },
      {
        value: timeElapsed.seconds,
        label: 's'
      }
    ];
    
    // Remove zero values from small units only if they're at the beginning
    while (smallUnits.length > 0 && smallUnits[0].value === 0) {
      smallUnits.shift();
    }
    
    // Ensure we have at least one small unit
    if (smallUnits.length === 0) {
      smallUnits = [{ value: 0, label: 's' }];
    }
    
    return {
      largeUnits,
      smallUnits
    };
  };
  
  // Setup timer function
  const setupTimer = async (startTimeOverride = null) => {
    // Clear existing interval if any
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    try {
      const startTimeStr = startTimeOverride || await AsyncStorage.getItem('streakStartTime');
      if (!startTimeStr) {
        console.log('No streak start time found');
        router.replace('/(standalone)/start-streak');
        return null;
      }
      
      const startTime = parseInt(startTimeStr, 10);
      
      // Validate start time
      if (isNaN(startTime) || startTime > new Date().getTime()) {
        console.error('Invalid start time:', startTime);
        await AsyncStorage.removeItem('streakStartTime');
        router.replace('/(standalone)/start-streak');
        return null;
      }
      
      // Check if this is potentially a leftover from previous data
      // by checking if it's older than an hour but the app was just freshly installed/database wiped
      const isFirstLaunch = await AsyncStorage.getItem('appLaunched') !== 'true';
      const timeDiff = new Date().getTime() - startTime;
      const oneHourMs = 60 * 60 * 1000;
      
      if (isFirstLaunch && timeDiff > oneHourMs) {
        console.log('Detected potentially stale streak time on first launch - resetting');
        await AsyncStorage.removeItem('streakStartTime');
        await AsyncStorage.setItem('appLaunched', 'true');
        router.replace('/(standalone)/start-streak');
        return null;
      }
      
      // Mark app as launched
      await AsyncStorage.setItem('appLaunched', 'true');
      
      console.log('Setting up timer with start time:', new Date(startTime).toISOString());
      
      // Set the start date for display
      const startDateObj = new Date(startTime);
      setStartDate(startDateObj);
      
      // Initial update
      const updateTimer = () => {
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
      
      // Setup interval
      timerIntervalRef.current = setInterval(() => {
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
      };
      
      // Initial update
      updateTimer();
      
      return startTime;
    } catch (error) {
      console.error('Error setting up timer:', error);
      return null;
    }
  };

  // Initialize timer on mount
  useEffect(() => {
    setupTimer();
    loadUserName();
    
    // Cleanup interval on unmount
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Update time values with animation
  useEffect(() => {
    // Reset animation to 0 when seconds are 0 (start of minute) or animate based on current seconds
    if (timeElapsed.seconds === 0) {
      // At the start of each minute, reset to 0 first
      progressAnimation.value = 0;
      // Then after a tiny delay to ensure the reset is visible, start animation for the new minute
      setTimeout(() => {
        progressAnimation.value = withTiming(0.01, {
          duration: 300,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }, 50);
    } else {
      // During the minute, animate smoothly based on current second
      progressAnimation.value = withTiming(timeElapsed.seconds / 60, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
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

  const handleReset = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save the relapse time
      const relapseTime = new Date().getTime();
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('streakStartTime', relapseTime.toString());
      
      // Save to Firestore if user is authenticated
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const updateData = {
            streak_start_time: relapseTime,
            last_sync_time: relapseTime,
            relapse_history: arrayUnion({
              timestamp: relapseTime,
              previous_streak: timeElapsed
            })
          };
          
          // If initial_sobriety_date doesn't exist, set it to the earliest known streak start time
          if (!userData.initial_sobriety_date) {
            // Try to find the oldest relapse or use current streak start
            if (userData.relapse_history && userData.relapse_history.length > 0) {
              // Sort relapses by timestamp (oldest first)
              const sortedRelapses = [...userData.relapse_history].sort((a, b) => a.timestamp - b.timestamp);
              const oldestRelapse = sortedRelapses[0];
              // Use the oldest relapse's previous streak to estimate the initial start date
              const initialDate = oldestRelapse.timestamp - (oldestRelapse.previous_streak || 0);
              updateData.initial_sobriety_date = initialDate;
            } else {
              // If no relapses, use the previous streak start time
              updateData.initial_sobriety_date = userData.streak_start_time || relapseTime;
            }
          }
          
          await updateDoc(userDocRef, updateData);
        } else {
          // Document doesn't exist - create it
          await setDoc(userDocRef, {
            streak_start_time: relapseTime,
            initial_sobriety_date: relapseTime, // First relapse is also the initial date
            last_sync_time: relapseTime,
            relapse_history: [{
              timestamp: relapseTime,
              previous_streak: timeElapsed || 0
            }]
          });
        }
      }
      
      // Navigate to relapse screen
      router.push('/(standalone)/relapse');
    } catch (error) {
      console.error('Error saving relapse time:', error);
    }
  };

  // Update the handleButtonPress function to handle both 'checkin' and 'emergency' types
  const handleButtonPress = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Add button press animation based on type
    let buttonScale;
    if (type === 'meditate') {
      buttonScale = meditateButtonScale;
      router.push('/(standalone)/meditate');
      
      // Set a timer to check points availability when returning from meditation
      setTimeout(() => {
        checkPointsAvailability();
      }, 1000);
    } else if (type === 'pledge') {
      buttonScale = pledgeButtonScale;
      router.push('/(standalone)/pledge');
    } else if (type === 'journal') {
      buttonScale = journalButtonScale;
      router.push({
        pathname: '/(main)/recovery',
        params: { initialTab: 'journal' }
      });
      
      // Set a timer to check points availability when returning from journaling
      setTimeout(() => {
        checkPointsAvailability();
      }, 1000);
    } else if (type === 'checkin') {
      buttonScale = pledgeButtonScale;
      router.push('/(standalone)/checkin');
    } else if (type === 'emergency') {
      buttonScale = pledgeButtonScale;
      router.push('/(standalone)/panic');
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

  // Calculate brain fog reduction (starts at 100%, decreases to 0%)
  const calculateBrainFog = () => {
    if (!timeElapsed) return 100;
    
    // Brain fog typically clears significantly in 90 days
    const totalDays = 90;
    
    // Use ms to days conversion for current streak
    const currentDays = timeElapsed.days || Math.floor(timeElapsed / (1000 * 60 * 60 * 24)) || 0;
    
    // Base calculation using current streak
    let remainingFog = 100 - ((currentDays / totalDays) * 100);
    
    // Check if we have relapse history to refine the calculation
    if (relapseHistory && relapseHistory.length > 0) {
      const now = new Date().getTime();
      
      // Sort relapses by timestamp (newest first)
      const sortedRelapses = [...relapseHistory].sort((a, b) => b.timestamp - a.timestamp);
      
      // Get initial start date - either from state or estimate from relapses
      let initialStartTime;
      if (initialSobrietyDate) {
        initialStartTime = initialSobrietyDate;
      } else {
        // Find the oldest relapse to get an approximate initial start date
        const oldestRelapse = sortedRelapses[sortedRelapses.length - 1];
        initialStartTime = oldestRelapse.timestamp - (oldestRelapse.previous_streak || 0);
      }
      
      // Calculate total days in recovery (including relapses)
      const totalRecoveryDays = Math.floor((now - initialStartTime) / (1000 * 60 * 60 * 24));
      
      // Use total recovery time as a baseline (with a cap)
      const baselineRecovery = Math.min(100, (totalRecoveryDays / totalDays) * 100);
      const baselineRemaining = 100 - baselineRecovery;
      
      // Apply penalties for recent relapses (more weight for recent relapses)
      let relapsePenalty = 0;
      
      sortedRelapses.forEach((relapse, index) => {
        // Calculate days since this relapse
        const daysSinceRelapse = Math.floor((now - relapse.timestamp) / (1000 * 60 * 60 * 24));
        
        // Penalties reduce over time (14 days to fully recover from a relapse for brain fog)
        const recoveryDays = 14;
        const remainingPenalty = Math.max(0, (recoveryDays - daysSinceRelapse) / recoveryDays);
        
        // Base penalty of 20% (which reduces over the recovery period)
        const basePenalty = 20 * remainingPenalty;
        
        // More recent relapses have higher weight (first/newest has weight 1, decreasing by 0.25)
        const weight = Math.max(0.25, 1 - (index * 0.25));
        
        relapsePenalty += basePenalty * weight;
      });
      
      // Cap total penalty at 75%
      relapsePenalty = Math.min(75, relapsePenalty);
      
      // Use the better of current streak calculation or longer-term calculation with penalties
      remainingFog = Math.min(remainingFog, baselineRemaining + relapsePenalty);
    }
    
    // Ensure fog is between 0-100%
    return Math.max(0, Math.floor(remainingFog));
  };

  // Calculate lung buildup reduction (starts at 100%, decreases to 0%)
  const calculateLungBuildup = () => {
    if (!timeElapsed) return 100;
    
    // Lung buildup clears significantly in 30 days
    const totalDays = 30;
    
    // Use ms to days conversion for current streak
    const currentDays = timeElapsed.days || Math.floor(timeElapsed / (1000 * 60 * 60 * 24)) || 0;
    
    // Base calculation using current streak
    let remainingBuildup = 100 - ((currentDays / totalDays) * 100);
    
    // Check if we have relapse history to refine the calculation
    if (relapseHistory && relapseHistory.length > 0) {
      const now = new Date().getTime();
      
      // Sort relapses by timestamp (newest first)
      const sortedRelapses = [...relapseHistory].sort((a, b) => b.timestamp - a.timestamp);
      
      // Get initial start date - either from state or estimate from relapses
      let initialStartTime;
      if (initialSobrietyDate) {
        initialStartTime = initialSobrietyDate;
      } else {
        // Find the oldest relapse to get an approximate initial start date
        const oldestRelapse = sortedRelapses[sortedRelapses.length - 1];
        initialStartTime = oldestRelapse.timestamp - (oldestRelapse.previous_streak || 0);
      }
      
      // Calculate total days in recovery (including relapses)
      const totalRecoveryDays = Math.floor((now - initialStartTime) / (1000 * 60 * 60 * 24));
      
      // Use total recovery time as a baseline (with a cap)
      const baselineRecovery = Math.min(100, (totalRecoveryDays / totalDays) * 100);
      const baselineRemaining = 100 - baselineRecovery;
      
      // Apply penalties for recent relapses (more weight for recent relapses)
      let relapsePenalty = 0;
      
      sortedRelapses.forEach((relapse, index) => {
        // Calculate days since this relapse
        const daysSinceRelapse = Math.floor((now - relapse.timestamp) / (1000 * 60 * 60 * 24));
        
        // Penalties reduce over time (7 days to fully recover from a relapse for lung buildup)
        const recoveryDays = 7;
        const remainingPenalty = Math.max(0, (recoveryDays - daysSinceRelapse) / recoveryDays);
        
        // Base penalty of 30% (which reduces over the recovery period)
        const basePenalty = 30 * remainingPenalty;
        
        // More recent relapses have higher weight (first/newest has weight 1, decreasing by 0.25)
        const weight = Math.max(0.25, 1 - (index * 0.25));
        
        relapsePenalty += basePenalty * weight;
      });
      
      // Cap total penalty at 85%
      relapsePenalty = Math.min(85, relapsePenalty);
      
      // Use the better of current streak calculation or longer-term calculation with penalties
      remainingBuildup = Math.min(remainingBuildup, baselineRemaining + relapsePenalty);
    }
    
    // Ensure buildup is between 0-100%
    return Math.max(0, Math.floor(remainingBuildup));
  };

  // Calculate sleep impairment reduction (starts at 100%, decreases to 0%)
  const calculateSleepImpairment = () => {
    if (!timeElapsed) return 100;
    
    // Sleep impairment typically reduces in 14 days
    const totalDays = 14;
    
    // Use ms to days conversion for current streak
    const currentDays = timeElapsed.days || Math.floor(timeElapsed / (1000 * 60 * 60 * 24)) || 0;
    
    // Base calculation using current streak
    let remainingImpairment = 100 - ((currentDays / totalDays) * 100);
    
    // Check if we have relapse history to refine the calculation
    if (relapseHistory && relapseHistory.length > 0) {
      const now = new Date().getTime();
      
      // Sort relapses by timestamp (newest first)
      const sortedRelapses = [...relapseHistory].sort((a, b) => b.timestamp - a.timestamp);
      
      // Get initial start date - either from state or estimate from relapses
      let initialStartTime;
      if (initialSobrietyDate) {
        initialStartTime = initialSobrietyDate;
      } else {
        // Find the oldest relapse to get an approximate initial start date
        const oldestRelapse = sortedRelapses[sortedRelapses.length - 1];
        initialStartTime = oldestRelapse.timestamp - (oldestRelapse.previous_streak || 0);
      }
      
      // Calculate total days in recovery (including relapses)
      const totalRecoveryDays = Math.floor((now - initialStartTime) / (1000 * 60 * 60 * 24));
      
      // Use total recovery time as a baseline (with a cap)
      const baselineRecovery = Math.min(100, (totalRecoveryDays / totalDays) * 100);
      const baselineRemaining = 100 - baselineRecovery;
      
      // Apply penalties for recent relapses (more weight for recent relapses)
      let relapsePenalty = 0;
      
      sortedRelapses.forEach((relapse, index) => {
        // Calculate days since this relapse
        const daysSinceRelapse = Math.floor((now - relapse.timestamp) / (1000 * 60 * 60 * 24));
        
        // Penalties reduce over time (4 days to fully recover from a relapse for sleep)
        const recoveryDays = 4;
        const remainingPenalty = Math.max(0, (recoveryDays - daysSinceRelapse) / recoveryDays);
        
        // Base penalty of 40% (which reduces over the recovery period)
        const basePenalty = 40 * remainingPenalty;
        
        // More recent relapses have higher weight (first/newest has weight 1, decreasing by 0.25)
        const weight = Math.max(0.25, 1 - (index * 0.25));
        
        relapsePenalty += basePenalty * weight;
      });
      
      // Cap total penalty at 90%
      relapsePenalty = Math.min(90, relapsePenalty);
      
      // Use the better of current streak calculation or longer-term calculation with penalties
      remainingImpairment = Math.min(remainingImpairment, baselineRemaining + relapsePenalty);
    }
    
    // Ensure impairment is between 0-100%
    return Math.max(0, Math.floor(remainingImpairment));
  };

  // Calculate money saved based on user's spending data
  const [weedCostData, setWeedCostData] = useState(null);
  const [dailySpend, setDailySpend] = useState(15); // Default value of $15 per day

  useEffect(() => {
    // Load weed cost data from Firestore when user is authenticated
    const loadWeedCostData = async () => {
      try {
        if (!auth.currentUser) return;
        
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if we have the weed cost data from onboarding
          if (userData.weed_cost) {
            setWeedCostData(userData.weed_cost);
            
            // Calculate daily spend based on frequency
            let calculatedDailySpend = 15; // Default
            const { amount, frequency, annual_cost } = userData.weed_cost;
            
            if (annual_cost) {
              // If we have annual cost, simply divide by 365
              calculatedDailySpend = annual_cost / 365;
            } else if (amount && frequency) {
              // Otherwise calculate based on amount and frequency
              switch (frequency) {
                case 'daily':
                  calculatedDailySpend = amount;
                  break;
                case 'weekly':
                  calculatedDailySpend = amount / 7;
                  break;
                case 'monthly':
                  calculatedDailySpend = amount / 30;
                  break;
                default:
                  calculatedDailySpend = 15; // Default
              }
            }
            
            console.log(`Calculated daily spend: $${calculatedDailySpend.toFixed(2)}`);
            setDailySpend(calculatedDailySpend);
          }
        }
      } catch (error) {
        console.error('Error loading weed cost data:', error);
      }
    };
    
    loadWeedCostData();
  }, [auth.currentUser]);

  // Cache projected money saved calculations
  const projectedSavings = useMemo(() => {
    // Make sure dailySpend is a valid number
    const spend = typeof dailySpend === 'number' && !isNaN(dailySpend) ? dailySpend : 15;
    
    // Calculate all common projections at once
    return {
      month: Math.floor(30 * spend).toLocaleString(),
      sixMonths: Math.floor(180 * spend).toLocaleString(),
      year: Math.floor(365 * spend).toLocaleString()
    };
  }, [dailySpend]);
  
  // Helper function to get projected savings using cached results
  const calculateProjectedMoneySaved = (days) => {
    if (days === 30) return projectedSavings.month;
    if (days === 180) return projectedSavings.sixMonths;
    if (days === 365) return projectedSavings.year;
    
    // For any other values, calculate on the fly
    const spend = typeof dailySpend === 'number' && !isNaN(dailySpend) ? dailySpend : 15;
    return Math.floor(days * spend).toLocaleString();
  };

  // Create a state to store the calculated money saved value
  const [savedMoney, setSavedMoney] = useState("0");
  
  // Calculate money saved and update state when dependencies change, not on every render
  useEffect(() => {
    // Get the current time
    const now = new Date().getTime();
    
    // Make sure dailySpend is a valid number
    const spend = typeof dailySpend === 'number' && !isNaN(dailySpend) ? dailySpend : 15;
    
    let result = "0";
    
    // If initialSobrietyDate is available, use it (this is the profile creation date)
    if (initialSobrietyDate && !isNaN(initialSobrietyDate)) {
      const daysPassed = (now - initialSobrietyDate) / (1000 * 60 * 60 * 24);
      // Make sure daysPassed is a valid positive number
      const validDays = daysPassed > 0 ? daysPassed : 0;
      const saved = Math.floor(validDays * spend);
      result = saved.toLocaleString();
    } 
    // Fallback to current streak if initialSobrietyDate is not available
    else if (timeElapsed) {
      let daysPassed = 0;
      if (typeof timeElapsed === 'object' && timeElapsed.days !== undefined) {
        daysPassed = timeElapsed.days;
      } else if (typeof timeElapsed === 'number') {
        daysPassed = timeElapsed / (1000 * 60 * 60 * 24);
      }
      // Make sure daysPassed is a valid positive number
      const validDays = daysPassed > 0 ? daysPassed : 0;
      const saved = Math.floor(validDays * spend);
      result = saved.toLocaleString();
    }
    
    setSavedMoney(result);
    
  }, [initialSobrietyDate, dailySpend, timeElapsed?.days]);
  
  // Keep the calculation function for compatibility, but use the cached value
  const calculateMoneySaved = () => {
    return savedMoney;
  };

  // Sync timer with Firestore
  const syncTimerWithFirestore = async () => {
    try {
      if (!auth.currentUser) return;

      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      const localStartTime = await AsyncStorage.getItem('streakStartTime');
      const now = new Date().getTime();
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // If database has a start time
        if (userData.streak_start_time) {
          const dbStartTime = userData.streak_start_time;
          const localTimeNum = localStartTime ? parseInt(localStartTime, 10) : 0;
          
          // Use the earlier start time (longer streak)
          if (!localStartTime || dbStartTime < localTimeNum) {
            console.log('Using database streak time');
            await AsyncStorage.setItem('streakStartTime', dbStartTime.toString());
            await setupTimer(dbStartTime.toString());
          } else if (localTimeNum < dbStartTime) {
            console.log('Local streak time is earlier, updating database');
            await updateDoc(userDocRef, {
              streak_start_time: localTimeNum,
              last_sync_time: now
            });
          }
        }
        // If database has no start time but local does
        else if (localStartTime) {
          console.log('Saving local streak time to database');
          await updateDoc(userDocRef, {
            streak_start_time: parseInt(localStartTime, 10),
            last_sync_time: now
          });
        }
      } else {
        // Create user document if it doesn't exist
        if (localStartTime) {
          console.log('Creating new user document with streak time');
          await setDoc(userDocRef, {
            streak_start_time: parseInt(localStartTime, 10),
            last_sync_time: now,
            onboarding_completed: true,
            questions_completed: true,
            payment_completed: true,
            relapse_history: []
          });
        }
      }
    } catch (error) {
      console.error('Error syncing timer:', error);
    }
  };

  // Check auth and onboarding status
  const checkAuthAndOnboarding = async () => {
    try {
      console.log('Checking auth and onboarding status...');
      
      if (!auth.currentUser) {
        console.log('No authenticated user found, redirecting to sign-in');
        setIsLoading(false); // Make sure loading is disabled
        router.replace('/(auth)/login');
        return;
      }

      console.log('User is authenticated, checking Firestore document...');
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      
      try {
        const userDoc = await getDoc(userDocRef);
        
        // Load user name
        await loadUserName();
        
        // Load user points and level
        await loadUserPointsAndLevel();
        
        if (!userDoc.exists()) {
          console.log('User document does not exist, creating new document');
          // Create the user document with onboarding state
          await setupNewUserDocument();
          
          const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
          if (onboardingCompleted !== 'true') {
            console.log('Onboarding not completed, redirecting to onboarding');
            setIsLoading(false); // Make sure loading is disabled
            router.replace('/(onboarding)/good-news');
            return;
          }
        } else {
          console.log('User document exists, checking onboarding status...');
          const userData = userDoc.data();
          
          // If onboarding is not completed in Firestore
          if (!userData.onboarding_completed || userData.onboarding_state !== 'completed') {
            console.log('Onboarding not completed according to Firestore');
            handleIncompleteOnboarding(userData);
            setIsLoading(false); // Make sure loading is disabled
            return;
          }
        }
        
        // If we made it here, we can initialize the timer
        console.log('Setting up timer...');
        // Sync timer data between local storage and database
        await syncTimerWithFirestore();
        
        const streakStartTime = await AsyncStorage.getItem('streakStartTime');
        if (!streakStartTime) {
          console.log('No streak start time found, redirecting to start-streak');
          setIsLoading(false);
          router.replace('/(standalone)/start-streak');
          return;
        }
        
        await setupTimer();
        setIsLoading(false);
        
      } catch (error) {
        console.error('Error checking auth and onboarding:', error);
        setError(error.message);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error in checkAuthAndOnboarding:', error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  // Add periodic sync
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (!isFirebaseInitialized()) {
          console.log('Firebase is not initialized yet, setting loading to false');
          setIsLoading(false);
          setError('Firebase authentication is not initialized. Please restart the app.');
          return;
        }
        
        await checkAuthAndOnboarding();
        
        // Set up periodic sync every 5 minutes
        const syncInterval = setInterval(syncTimerWithFirestore, 5 * 60 * 1000);
        return () => clearInterval(syncInterval);
      } catch (error) {
        console.error('Error in auth check:', error);
        setIsLoading(false);
        setError(error.message);
      }
    };
    
    checkAuth();
  }, []);

  // Modify handleTimeAdjust to use Firebase
  const handleTimeAdjust = async () => {
    try {
      const now = new Date();
      const years = parseInt(adjustedTime.years, 10) || 0;
      const months = parseInt(adjustedTime.months, 10) || 0;
      const weeks = parseInt(adjustedTime.weeks, 10) || 0;
      const days = parseInt(adjustedTime.days, 10) || 0;
      const hours = parseInt(adjustedTime.hours, 10) || 0;
      const minutes = parseInt(adjustedTime.minutes, 10) || 0;

      const totalMs = (
        years * 365 * 24 * 60 * 60 * 1000 +
        months * 30 * 24 * 60 * 60 * 1000 +
        weeks * 7 * 24 * 60 * 60 * 1000 +
        days * 24 * 60 * 60 * 1000 +
        hours * 60 * 60 * 1000 +
        minutes * 60 * 1000
      );

      const adjustedTimeMs = now.getTime() - totalMs;
      
      // Update both local storage and database
      await AsyncStorage.setItem('streakStartTime', adjustedTimeMs.toString());
      
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userDocRef, {
          streak_start_time: adjustedTimeMs,
          last_sync_time: now.getTime()
        });
      }

      await setupTimer(adjustedTimeMs.toString());
      
      setShowTimeAdjustModal(false);
      setAdjustedTime({
        years: '0',
        months: '0',
        weeks: '0',
        days: '0',
        hours: '0',
        minutes: '0'
      });
    } catch (error) {
      console.error('Error adjusting time:', error);
    }
  };

  // Handle individual time unit changes
  const handleTimeUnitChange = (unit, value) => {
    // Only allow numbers and empty string
    if (value === '' || /^\d+$/.test(value)) {
      setAdjustedTime(prev => ({
        ...prev,
        [unit]: value
      }));
    }
  };

  // Add this function to load the user name from AsyncStorage
  const loadUserName = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      if (name) {
        setUserName(name);
      }
    } catch (error) {
      console.error('Error loading user name:', error);
    }
  };

  // Add a function to handle swipe gesture
  const handleSwipe = (direction) => {
    if (direction === 'left' && !showStartDate) {
      // Swipe left to show start date
      swipeAnim.value = withTiming(1, { duration: 300 });
      setShowStartDate(true);
    } else if (direction === 'right' && showStartDate) {
      // Swipe right to show timer
      swipeAnim.value = withTiming(0, { duration: 300 });
      setShowStartDate(false);
    }
  };

  // Create animated styles for the swipeable views
  const timerViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(swipeAnim.value, [0, 1], [0, -width]) }
      ],
      opacity: interpolate(swipeAnim.value, [0, 0.5], [1, 0])
    };
  });

  const startDateViewStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: interpolate(swipeAnim.value, [0, 1], [width, 0]) }
      ],
      opacity: interpolate(swipeAnim.value, [0.5, 1], [0, 1])
    };
  });

  // Format the start date for display
  const formatStartDate = () => {
    if (!startDate) return 'Unknown start date';
    
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    
    return `Started on:\n${startDate.toLocaleDateString(undefined, options)}`;
  };

  // Add function to award daily login points
  const checkAndAwardDailyLoginPoints = async () => {
    try {
      // Return early if already checking to prevent multiple popups
      if (isCheckingLogin) {
        return;
      }
      
      // Set checking flag to true
      setIsCheckingLogin(true);
      
      // Only award points if user is authenticated
      if (!isFirebaseInitialized() || !auth.currentUser) {
        setIsCheckingLogin(false);
        return;
      }
      
      const userId = auth.currentUser.uid;
      const lastLoginKey = `last_login_${userId}`;
      const lastPopupKey = `last_popup_${userId}`;
      const lastLevelUpKey = `last_level_up_${userId}`;
      
      // Get current time and reset to start of day for consistent comparison
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      const tomorrow = today + (24 * 60 * 60 * 1000);
      
      // Set cooldown to end at midnight tomorrow
      setDailyLoginCooldown(tomorrow);
      
      // Check if we already showed a popup today, exit early if so
      const lastPopupStr = await AsyncStorage.getItem(lastPopupKey);
      if (lastPopupStr) {
        const lastPopup = parseInt(lastPopupStr);
        // If we've already shown a popup today, don't show another one
        if (lastPopup >= today) {
          console.log('Already showed a popup today, skipping');
          setIsCheckingLogin(false);
          return;
        }
      }
      
      // Check if we already awarded points today
      const lastLoginStr = await AsyncStorage.getItem(lastLoginKey);
      let alreadyAwarded = false;
      
      if (lastLoginStr) {
        const lastLogin = parseInt(lastLoginStr);
        if (lastLogin >= today) {
          alreadyAwarded = true;
          // Still refresh points and level to ensure UI is up to date
          await loadUserPointsAndLevel();
        }
      }
      
      // Mark that we've shown a popup today, regardless of whether we're awarding points
      await AsyncStorage.setItem(lastPopupKey, today.toString());
      
      // If we already awarded points, don't do it again but we can still show a popup
      if (!alreadyAwarded) {
        // Award daily login points
        const pointsResult = await awardDailyLoginPoints(userId);
        
        // If successful, update last login date and popup date
        if (pointsResult) {
          await AsyncStorage.setItem(lastLoginKey, today.toString());
          
          // Update UI with new points
          setUserPoints(pointsResult.newPoints);
          
          // Get updated level
          if (pointsResult.levelInfo) {
            setUserLevel(pointsResult.levelInfo.level);
          }
          
          // Refresh the full user data to ensure consistency
          await loadUserPointsAndLevel();
          
          // If user leveled up, show a notification with level up cooldown
          if (pointsResult.leveledUp) {
            // Check if we've shown a level up popup today
            const lastLevelUpStr = await AsyncStorage.getItem(lastLevelUpKey);
            let skipLevelUpAlert = false;
            
            if (lastLevelUpStr) {
              const lastLevelUp = parseInt(lastLevelUpStr);
              skipLevelUpAlert = (lastLevelUp >= today);
            }
            
            if (!skipLevelUpAlert) {
              // Show level up popup and update last level up date
              setCelebrationAlert({
                visible: true,
                title: '🎉 Level Up!',
                message: `Congratulations! You've reached Level ${pointsResult.levelInfo.level}!`
              });
              await AsyncStorage.setItem(lastLevelUpKey, today.toString());
            }
          } else {
            // Show daily login popup
            setCelebrationAlert({
              visible: true,
              title: '🌟 Daily Login Bonus',
              message: 'You earned 5 points for logging in today!'
            });
          }
        }
      }
      
      // Finally, reset the checking flag
      setIsCheckingLogin(false);
    } catch (error) {
      console.error('Error awarding daily login points:', error);
      setIsCheckingLogin(false);
    }
  };

  // Add useEffect to check for daily login
  useEffect(() => {
    // Track whether we've already run the check in this session
    const checkTimeKey = `daily_login_check_time_${auth.currentUser?.uid}`;
    
    const checkLogin = async () => {
      if (!isFirebaseInitialized() || !auth.currentUser) {
        return;
      }
      
      try {
        // Check if we've already run this check recently (within last 5 minutes)
        const lastCheckTimeStr = await AsyncStorage.getItem(checkTimeKey);
        
        if (lastCheckTimeStr) {
          const lastCheckTime = parseInt(lastCheckTimeStr);
          const now = new Date().getTime();
          const FIVE_MINUTES = 5 * 60 * 1000;
          
          // If we checked within the last 5 minutes, don't check again
          if (now - lastCheckTime < FIVE_MINUTES) {
            console.log('Skipping daily login check - already checked recently');
            return;
          }
        }
        
        // Set the last check time before running the check
        await AsyncStorage.setItem(checkTimeKey, new Date().getTime().toString());
        
        // Now run the actual check
        await checkAndAwardDailyLoginPoints();
      } catch (error) {
        console.error('Error in daily login check:', error);
      }
    };
    
    // Only run this once when the component mounts, not on every auth.currentUser?.uid change
    const timer = setTimeout(() => {
      if (auth.currentUser?.uid) {
        checkLogin();
      }
    }, 1000); // Wait 1 second after mount before checking
    
    return () => clearTimeout(timer);
  }, []); // Empty dependency array means this only runs once on mount

  // Add function to load user points and level
  const loadUserPointsAndLevel = async () => {
    try {
      if (isFirebaseInitialized() && auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPoints(userData.points || 0);
          
          // Calculate level from points
          if (userData.points) {
            // Import calculateLevel function
            const { calculateLevel } = await import('../../src/utils/achievementUtils');
            const levelData = calculateLevel(userData.points);
            setUserLevel(levelData.level);
          }
        }
      }
    } catch (error) {
      console.error('Error loading user points and level:', error);
    }
  };

  // Add useEffect to periodically refresh user points and level
  useEffect(() => {
    // Check for points and level updates every 5 minutes
    const pointsRefreshInterval = setInterval(async () => {
      if (isFirebaseInitialized() && auth.currentUser) {
        await loadUserPointsAndLevel();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(pointsRefreshInterval);
  }, []);

  // Helper function to set up a new user document
  const setupNewUserDocument = async () => {
    const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');
    const streakStartTime = await AsyncStorage.getItem('streakStartTime');
    const currentTime = new Date().getTime();
    
    // Use the current streak start time as the initial sobriety date
    const initialStartTime = streakStartTime ? parseInt(streakStartTime, 10) : currentTime;
    
    // Try to get weed cost data from local storage if available
    let weedCostData = null;
    try {
      const answers = await AsyncStorage.getItem('onboardingAnswers');
      if (answers) {
        const parsedAnswers = JSON.parse(answers);
        if (parsedAnswers.weed_cost) {
          weedCostData = parsedAnswers.weed_cost;
          console.log('Found weed cost data in local storage', weedCostData);
        }
      }
    } catch (error) {
      console.error('Error getting weed cost data from local storage:', error);
    }
    
    // Create the user document with onboarding state
    const userDocData = {
      streak_start_time: initialStartTime,
      initial_sobriety_date: initialStartTime, // Add the initial sobriety date
      last_sync_time: currentTime,
      onboarding_completed: onboardingCompleted === 'true',
      questions_completed: onboardingCompleted === 'true',
      payment_completed: onboardingCompleted === 'true',
      onboarding_state: onboardingCompleted === 'true' ? 'completed' : 'pending',
      relapse_history: [] // Initialize empty relapse history
    };
    
    // Add weed cost data if available
    if (weedCostData) {
      userDocData.weed_cost = weedCostData;
    }
    
    await setDoc(doc(db, 'users', auth.currentUser.uid), userDocData);
  };

  // Helper function to handle incomplete onboarding
  const handleIncompleteOnboarding = (userData) => {
    // Check if questions are completed to determine where to send the user
    if (!userData.questions_completed) {
      console.log('Questions not completed, redirecting to questions');
      router.replace('/(onboarding)/questions/addiction/frequency');
      return;
    } 
    // If questions completed but not payment
    else if (userData.questions_completed && !userData.payment_completed) {
      console.log('Questions completed but payment not done, redirecting to paywall');
      router.replace('/(onboarding)/paywall');
      return;
    }
    // If payment completed but not community setup
    else if (userData.payment_completed && !userData.onboarding_completed) {
      console.log('Payment completed but onboarding not done, redirecting to community setup');
      router.replace('/(onboarding)/community-setup');
      return;
    }
    // Default to onboarding start if state is unclear
    else {
      console.log('Unclear onboarding state, redirecting to beginning of onboarding');
      router.replace('/(onboarding)/good-news');
      return;
    }
  };

  // Set a timeout to prevent infinite loading
  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.log('Loading timeout reached, forcing loading state to false');
        setIsLoading(false);
        setError('Loading timeout reached. Please check your internet connection and try again.');
      }
    }, 10000); // 10 seconds timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [isLoading]);

  // Function to show banner notifications
  const showBanner = (message, type = 'info') => {
    setBannerMessage(message);
    setBannerType(type);
    
    // Auto-hide banner after 3 seconds
    setTimeout(() => {
      setBannerMessage('');
    }, 3000);
  };

  // Get user's progress percentage for current level
  const calculateLevelProgressPercentage = () => {
    if (!userPoints) return 0;
    
    // Find the current level threshold and next level threshold
    let currentLevelPoints = 0;
    let nextLevelPoints = 25; // Default for level 1
    
    // Using the thresholds from achievementUtils.js
    if (userLevel === 1) {
      currentLevelPoints = 0;
      nextLevelPoints = 25;
    } else if (userLevel === 2) {
      currentLevelPoints = 25;
      nextLevelPoints = 55;
    } else if (userLevel === 3) {
      currentLevelPoints = 55;
      nextLevelPoints = 90;
    } else if (userLevel === 4) {
      currentLevelPoints = 90;
      nextLevelPoints = 130;
    } else if (userLevel === 5) {
      currentLevelPoints = 130;
      nextLevelPoints = 175;
    } else if (userLevel >= 6) {
      currentLevelPoints = 175 + ((userLevel - 6) * 50);
      nextLevelPoints = currentLevelPoints + 50 + (5 * (userLevel - 5));
    }
    
    // Calculate points needed for this level
    const pointsNeededForThisLevel = nextLevelPoints - currentLevelPoints;
    
    // Calculate user's current points in this level
    const pointsInCurrentLevel = userPoints - currentLevelPoints;
    
    // Ensure progress is between 0-100%
    const percentage = Math.min(100, Math.max(0, Math.floor((pointsInCurrentLevel / pointsNeededForThisLevel) * 100)));
    
    return percentage;
  };

  // Get points needed for next level
  const getPointsForNextLevel = () => {
    // Using the thresholds from achievementUtils.js
    if (userLevel === 1) return 25;
    if (userLevel === 2) return 55;
    if (userLevel === 3) return 90;
    if (userLevel === 4) return 130;
    if (userLevel === 5) return 175;
    if (userLevel >= 6) {
      const currentLevelPoints = 175 + ((userLevel - 6) * 50);
      return currentLevelPoints + 50 + (5 * (userLevel - 5));
    }
    return 25; // Default for level 1
  };

  // Get current level starting points
  const getCurrentLevelStartingPoints = () => {
    if (userLevel === 1) return 0;
    if (userLevel === 2) return 25;
    if (userLevel === 3) return 55;
    if (userLevel === 4) return 90;
    if (userLevel === 5) return 130;
    if (userLevel >= 6) {
      return 175 + ((userLevel - 6) * 50);
    }
    return 0; // Default
  };

  // Add this function to fetch user achievements
  const fetchUserAchievements = async () => {
    try {
      if (isFirebaseInitialized() && auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.achievements) {
            setUserAchievements(userData.achievements);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user achievements:', error);
    }
  };

  // Add the function to fetch user data with initialSobrietyDate
  const fetchUserData = async () => {
    try {
      if (isFirebaseInitialized() && auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Set relapse history
          if (userData.relapse_history) {
            setRelapseHistory(userData.relapse_history);
          }
          
          // Set initial sobriety date
          if (userData.initial_sobriety_date) {
            console.log('Setting initialSobrietyDate from Firestore:', userData.initial_sobriety_date);
            // Ensure it's a valid number
            const date = Number(userData.initial_sobriety_date);
            if (!isNaN(date)) {
              setInitialSobrietyDate(date);
            } else {
              console.error('Invalid initialSobrietyDate from Firestore:', userData.initial_sobriety_date);
              // Fallback to streak_start_time if available
              if (userData.streak_start_time && !isNaN(userData.streak_start_time)) {
                console.log('Falling back to streak_start_time:', userData.streak_start_time);
                setInitialSobrietyDate(userData.streak_start_time);
              }
            }
          } else if (userData.streak_start_time) {
            // If no initial sobriety date but there is a streak start time, use that
            console.log('No initialSobrietyDate found, using streak_start_time:', userData.streak_start_time);
            setInitialSobrietyDate(userData.streak_start_time);
          } else {
            // If neither exists, set to current time
            console.log('No dates found, using current time');
            setInitialSobrietyDate(new Date().getTime());
          }
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  // Add the checkPointsAvailability function
  const checkPointsAvailability = async () => {
    try {
      if (isFirebaseInitialized() && auth.currentUser) {
        const userId = auth.currentUser.uid;
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check journal points cooldown
          if (userData.lastJournalPoints) {
            const now = Date.now();
            const twelveHoursInMs = 12 * 60 * 60 * 1000;
            const journalCooldownEnds = userData.lastJournalPoints + twelveHoursInMs;
            
            setJournalPointsAvailable(now > journalCooldownEnds);
          } else {
            setJournalPointsAvailable(true);
          }
          
          // Check meditation points cooldown
          if (userData.lastMeditationPoints) {
            const now = new Date().getTime();
            const twentyFourHoursInMs = 24 * 60 * 60 * 1000;
            const meditationCooldownEnds = userData.lastMeditationPoints + twentyFourHoursInMs;
            
            setMeditationPointsAvailable(now > meditationCooldownEnds);
            
            // Set the cooldown end time for display
            if (now < meditationCooldownEnds) {
              setMeditationCooldown(meditationCooldownEnds);
            } else {
              setMeditationCooldown(null);
            }
          } else {
            // No previous meditation points awarded, so points are available
            setMeditationPointsAvailable(true);
            setMeditationCooldown(null);
          }
        }
      }
    } catch (error) {
      console.error('Error checking points availability:', error);
    }
  };

  // Call checkPointsAvailability on component mount and when user data changes
  useEffect(() => {
    if (auth.currentUser) {
      checkPointsAvailability();
      
      // Set up interval to check more frequently (every 10 seconds)
      const interval = setInterval(() => {
        checkPointsAvailability();
      }, 10 * 1000); // Check every 10 seconds instead of every minute
      
      return () => clearInterval(interval);
    }
  }, [auth.currentUser?.uid]);

  // Add formatCooldownTime helper function
  const formatCooldownTime = (cooldownEndTime) => {
    if (!cooldownEndTime) return null;
    
    const now = new Date().getTime();
    const remainingTime = cooldownEndTime - now;
    
    if (remainingTime <= 0) return null;
    
    // Convert to hours and minutes
    const hours = Math.floor(remainingTime / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Add a function to update cooldown timers every minute
  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date().getTime();
      
      // Update UI even when cooldowns haven't changed to reflect accurate time
      if (dailyLoginCooldown && dailyLoginCooldown > now) {
        // Force a re-render by setting to the same value
        setDailyLoginCooldown(dailyLoginCooldown);
      }
      
      if (meditationCooldown && meditationCooldown > now) {
        // Force a re-render by setting to the same value
        setMeditationCooldown(meditationCooldown);
      }
    }, 60 * 1000); // Update every minute
    
    return () => clearInterval(timerInterval);
  }, [dailyLoginCooldown, meditationCooldown]);

  // Initialize cooldown values on component mount
  useEffect(() => {
    const initializeCooldowns = async () => {
      if (!isFirebaseInitialized() || !auth.currentUser) return;
      
      try {
        const userId = auth.currentUser.uid;
        const lastLoginKey = `last_login_${userId}`;
        
        // Get current time and reset to start of day for consistent comparison
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const tomorrow = today + (24 * 60 * 60 * 1000);
        
        // Check if we already awarded points today
        const lastLoginStr = await AsyncStorage.getItem(lastLoginKey);
        
        if (lastLoginStr) {
          const lastLogin = parseInt(lastLoginStr);
          if (lastLogin >= today) {
            // If we've already logged in today, set the cooldown to tomorrow
            setDailyLoginCooldown(tomorrow);
          } else {
            // We haven't logged in today yet
            setDailyLoginCooldown(null);
          }
        } else {
          // We've never logged in before
          setDailyLoginCooldown(null);
        }
      } catch (error) {
        console.error('Error initializing cooldowns:', error);
      }
    };
    
    initializeCooldowns();
  }, [auth.currentUser?.uid]);

  // Add AppState event listener to update point indicators when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === 'active') {
        // The app has come to the foreground
        checkPointsAvailability();
      }
    };

    // Subscribe to AppState changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    // Clean up the subscription on unmount
    return () => {
      subscription.remove();
    };
  }, []);

  // Add the fetchUserData call to useEffect
  useEffect(() => {
    fetchUserData();
    fetchUserAchievements();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Something went wrong</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => router.replace('/(main)')}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Add the CelebrationAlert component at the top-level */}
      <CelebrationAlert
        visible={celebrationAlert?.visible}
        title={celebrationAlert?.title}
        message={celebrationAlert?.message}
        onClose={() => setCelebrationAlert({visible: false, title: '', message: ''})}
      />
      
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View style={[
        styles.headerContainer, 
        headerStyle, 
        { paddingTop: insets.top + 5 }
      ]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🥦</Text>
          <Text style={styles.logoText}>Broccoli</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => handleButtonPress('settings')}
        >
          <Ionicons name="settings-outline" size={24} color="#232323" />
        </TouchableOpacity>
      </Animated.View>
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70, paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* User Greeting */}
        <Text style={styles.userGreeting}>Hello, {userName || 'Friend'} 👋</Text>
        
        {/* Main Timer Card */}
        <View style={styles.timerCardContainer}>
          <View style={styles.timerCard}>
            <View style={styles.timerHeader}>
              <Text style={styles.timerHeaderTitle}>Sobriety Timer</Text>
              {startDate && (
                <TouchableOpacity 
                  style={styles.startDateButton}
                  onPress={() => setShowStartDate(!showStartDate)}
                >
                  <Text style={styles.startDateText}>
                    {showStartDate ? 'Hide' : 'Show'} Start Date
                  </Text>
                  <Ionicons 
                    name={showStartDate ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#4CAF50" 
                  />
                </TouchableOpacity>
              )}
            </View>
            
            {showStartDate && startDate && (
              <View style={styles.startDateContainer}>
                <Text style={styles.startDateLabel}>
                  Started: {formatStartDate()}
                </Text>
              </View>
            )}
            
            {/* Timer Circle */}
            <View style={styles.timerCircleContainer}>
              <Animated.View style={[styles.timerCircle, pulseStyle]}>
                {/* Progress Ring */}
                <Svg 
                  width={CIRCLE_SIZE + 40} 
                  height={CIRCLE_SIZE + 40} 
                  style={{
                    position: 'absolute',
                    transform: [{ rotate: '-90deg' }],
                  }}
                >
                  {/* Background Circle */}
                  <Circle
                    cx={(CIRCLE_SIZE + 40) / 2}
                    cy={(CIRCLE_SIZE + 40) / 2}
                    r={(CIRCLE_SIZE + 20) / 2}
                    fill="rgba(0, 0, 0, 0.15)"
                  />
                  <Circle
                    cx={(CIRCLE_SIZE + 40) / 2}
                    cy={(CIRCLE_SIZE + 40) / 2}
                    r={(CIRCLE_SIZE + 20) / 2}
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={PROGRESS_RING_WIDTH}
                    fill="transparent"
                  />
                  <AnimatedCircle
                    cx={(CIRCLE_SIZE + 40) / 2}
                    cy={(CIRCLE_SIZE + 40) / 2}
                    r={(CIRCLE_SIZE + 20) / 2}
                    stroke={PROGRESS_RING_COLOR}
                    strokeWidth={PROGRESS_RING_WIDTH}
                    strokeDasharray={2 * Math.PI * ((CIRCLE_SIZE + 20) / 2)}
                    strokeLinecap="round"
                    fill="transparent"
                    animatedProps={progressCircleProps}
                  />
                </Svg>
                
                {/* Time Display */}
                <View style={styles.timeDisplay}>
                  {(() => {
                    const { largeUnits, smallUnits } = getFormattedTimeUnits();
                    
                    return (
                      <>
                        {/* Large Units (Years, Months, etc) */}
                        {largeUnits.length > 0 && (
                          <View style={styles.largeUnitsRow}>
                            {largeUnits.map((unit, index) => (
                              <View key={index} style={styles.timeUnit}>
                                <Text style={styles.largeTimeValue}>{unit.value}</Text>
                                <Text style={styles.timeUnitLabel}>{unit.label}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        
                        {/* Small Units (Days, Hours, etc) */}
                        <View style={styles.smallUnitsRow}>
                          {smallUnits.map((unit, index) => (
                            <View key={index} style={styles.timeUnit}>
                              <Text style={styles.smallTimeValue}>{unit.value}</Text>
                              <Text style={styles.timeUnitLabel}>{unit.label}</Text>
                              {index < smallUnits.length - 1 && (
                                <Text style={styles.unitSeparator}>:</Text>
                              )}
                            </View>
                          ))}
                        </View>
                      </>
                    );
                  })()}
                </View>
                
                {/* Reset Button */}
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.resetButtonText}>Reset Timer</Text>
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            {/* Divider Line */}
            <View style={styles.dividerLine} />
            
            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleButtonPress('meditate')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonInner}>
                    <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
                    <Text style={styles.actionButtonText}>Meditate</Text>
                    {meditationPointsAvailable && (
                      <View style={styles.pointsIndicator}>
                        <Text style={styles.pointsIndicatorText}>+5</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleButtonPress('journal')}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionButtonInner}>
                    <Ionicons name="journal-outline" size={24} color="#4CAF50" />
                    <Text style={styles.actionButtonText}>Journal</Text>
                    {journalPointsAvailable && (
                      <View style={styles.pointsIndicator}>
                        <Text style={styles.pointsIndicatorText}>+5</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleButtonPress('checkin')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionButtonInner, styles.checkinButton]}>
                    <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
                    <Text style={[styles.actionButtonText, {color: '#4CAF50'}]}>Check In</Text>
                  </View>
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionButtonWrapper}>
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => handleButtonPress('emergency')}
                  activeOpacity={0.7}
                >
                  <View style={[styles.actionButtonInner, styles.sosButton]}>
                    <Ionicons name="alert-circle-outline" size={24} color="#E57373" />
                    <Text style={[styles.actionButtonText, {color: '#E57373'}]}>S.O.S</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
        
        {/* Replace Stats Row with Level Card */}
        <View style={styles.levelCard}>
          <View style={styles.levelSection}>
            <View style={styles.levelBadgeContainer}>
              <LinearGradient
                colors={['#4CAF50', '#2E7D32']}
                style={styles.levelBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.levelNumber}>{userLevel || 1}</Text>
              </LinearGradient>
            </View>
            <View style={styles.levelDetails}>
              <Text style={styles.levelTitle}>Level {userLevel || 1}</Text>
              <View style={styles.levelProgressContainer}>
                <View style={styles.levelProgressBar}>
                  <View 
                    style={[
                      styles.levelProgressFill, 
                      { width: `${calculateLevelProgressPercentage()}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.pointsText}>
                  {userPoints - getCurrentLevelStartingPoints()} / {getPointsForNextLevel() - getCurrentLevelStartingPoints()} points for next level
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.pointsInfoContainer}>
            <View style={styles.pointsInfoItem}>
              <Ionicons name="trophy" size={18} color="#4CAF50" />
              <Text style={styles.pointsInfoText}>Get points from achievements</Text>
            </View>
            
            <View style={styles.pointsInfoItem}>
              <Ionicons name="calendar" size={18} color="#4CAF50" />
              <View style={styles.pointsInfoTextContainer}>
                <Text style={styles.pointsInfoText}>
                  Daily login: +5 points
                  {dailyLoginCooldown && 
                    <Text style={styles.cooldownText}> (available in {formatCooldownTime(dailyLoginCooldown)})</Text>
                  }
                  {!dailyLoginCooldown &&
                    <Text style={styles.availableText}> (available now)</Text>
                  }
                </Text>
              </View>
            </View>
            
            <View style={styles.pointsInfoItem}>
              <Ionicons name="journal" size={18} color="#4CAF50" />
              <Text style={styles.pointsInfoText}>
                Journal entry: +5 points
                {!journalPointsAvailable && 
                  <Text style={styles.cooldownText}> (once per day)</Text>
                }
                {journalPointsAvailable &&
                  <Text style={styles.availableText}> (available now)</Text>
                }
              </Text>
            </View>
            
            <View style={styles.pointsInfoItem}>
              <Ionicons name="leaf" size={18} color="#4CAF50" />
              <Text style={styles.pointsInfoText}>
                Meditation: +5 points
                {meditationCooldown && 
                  <Text style={styles.cooldownText}> (available in {formatCooldownTime(meditationCooldown)})</Text>
                }
                {!meditationCooldown && 
                  <Text style={styles.availableText}> (available now)</Text>
                }
              </Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.viewPointsButton}
            onPress={() => router.push('/(main)/recovery?initialTab=achievements')}
          >
            <Text style={styles.viewPointsText}>View All Achievements</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Health Benefits Card */}
        <View style={styles.benefitsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Health Improvements</Text>
            <View style={styles.refreshContainer}>
              <Text style={styles.refreshText}>Real-time</Text>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconContainer, {backgroundColor: 'rgba(255, 182, 193, 0.2)'}]}>
              <Text style={styles.emojiIcon}>🧠</Text>
            </View>
            <View style={styles.benefitContent}>
              <View style={styles.benefitTextRow}>
                <Text style={styles.benefitTitle}>Brain Fog</Text>
                <Text style={[styles.benefitPercent, calculateBrainFog() < 50 ? {color: '#4CAF50'} : {color: '#FF7B9C'}]}>
                  {calculateBrainFog()}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${calculateBrainFog()}%`,
                      backgroundColor: calculateBrainFog() < 50 ? '#4CAF50' : '#FF7B9C',
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconContainer, {backgroundColor: 'rgba(244, 67, 54, 0.1)'}]}>
              <Text style={styles.emojiIcon}>🫁</Text>
            </View>
            <View style={styles.benefitContent}>
              <View style={styles.benefitTextRow}>
                <Text style={styles.benefitTitle}>Lung Buildup</Text>
                <Text style={[styles.benefitPercent, calculateLungBuildup() < 50 ? {color: '#4CAF50'} : {color: '#F44336'}]}>
                  {calculateLungBuildup()}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${calculateLungBuildup()}%`,
                      backgroundColor: calculateLungBuildup() < 50 ? '#4CAF50' : '#F44336',
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
          
          <View style={styles.benefitItem}>
            <View style={[styles.benefitIconContainer, {backgroundColor: 'rgba(33, 150, 243, 0.1)'}]}>
              <Text style={styles.emojiIcon}>😴</Text>
            </View>
            <View style={styles.benefitContent}>
              <View style={styles.benefitTextRow}>
                <Text style={styles.benefitTitle}>Sleep Impairment</Text>
                <Text style={[styles.benefitPercent, calculateSleepImpairment() < 50 ? {color: '#4CAF50'} : {color: '#2196F3'}]}>
                  {calculateSleepImpairment()}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${calculateSleepImpairment()}%`,
                      backgroundColor: calculateSleepImpairment() < 50 ? '#4CAF50' : '#2196F3',
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* Achievement Carousel */}
        <View style={styles.achievementsCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Achievements</Text>
            <TouchableOpacity 
              style={styles.viewAllContainer}
              onPress={() => router.push('/(main)/recovery?initialTab=achievements')}
            >
              <Text style={styles.viewAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#4CAF50" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.achievementsList}
            decelerationRate="fast"
            snapToInterval={90} // Width of item + margin
            snapToAlignment="start"
          >
            {ALL_ACHIEVEMENTS.map((achievement) => {
              // Calculate if achievement is unlocked based on days
              const daysPassed = timeElapsed ? Math.floor(timeElapsed / (1000 * 60 * 60 * 24)) : 0;
              const isUnlocked = userAchievements.includes(achievement.id) || 
                                (achievement.days > 0 && daysPassed >= achievement.days);
              
              return (
                <Animated.View 
                  key={achievement.id} 
                  style={[
                    styles.achievementItem,
                    { opacity: isUnlocked ? 1 : 0.7 }
                  ]}
                >
                  <View style={[
                    styles.achievementIcon, 
                    {
                      backgroundColor: isUnlocked ? achievement.color : '#E0E0E0',
                      borderWidth: isUnlocked ? 0 : 1,
                      borderColor: '#DDDDDD',
                    }
                  ]}>
                    <Ionicons 
                      name={achievement.icon} 
                      size={22} 
                      color={isUnlocked ? '#FFFFFF' : '#AAAAAA'} 
                    />
                    {isUnlocked && (
                      <View style={styles.checkmarkBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </View>
                  <Text 
                    style={[
                      styles.achievementName,
                      !isUnlocked && {color: '#999999'}
                    ]}
                    numberOfLines={1}
                  >
                    {achievement.title}
                  </Text>
                  <Text style={[
                    styles.achievementDay,
                    !isUnlocked && {color: '#BBBBBB'}
                  ]}>
                    {achievement.days} {achievement.days === 1 ? 'day' : 'days'}
                  </Text>
                </Animated.View>
              );
            })}
          </ScrollView>
        </View>
        
        {/* Money Saved Card */}
        <View style={styles.moneySavedCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Money Saved</Text>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => showBanner("You'll be able to set your spending habits soon!", "info")}
            >
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.moneySavedTotal}>
            <Text style={styles.currencySymbol}>$</Text>
            <Text style={styles.moneySavedValue}>{calculateMoneySaved()}</Text>
          </View>
          
          <View style={styles.projectionRow}>
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>1 Month</Text>
              <Text style={styles.projectionValue}>${calculateProjectedMoneySaved(30)}</Text>
            </View>
            
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>6 Months</Text>
              <Text style={styles.projectionValue}>${calculateProjectedMoneySaved(180)}</Text>
            </View>
            
            <View style={styles.projectionItem}>
              <Text style={styles.projectionLabel}>1 Year</Text>
              <Text style={styles.projectionValue}>${calculateProjectedMoneySaved(365)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      
      {/* Notifications/Panic Button */}
      <View style={[styles.floatingButtonsContainer, { bottom: insets.bottom + 70 }]}>
        <TouchableOpacity
          style={styles.panicButton}
          onPress={handlePanicButtonPress}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#F44336', '#D32F2F']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.panicButtonText}>I Need Help</Text>
        </TouchableOpacity>
      </View>
      
      {/* Time Adjust Modal */}
      <Modal
        visible={showTimeAdjustModal}
        transparent={true}
        animationType="fade"
      >
        {/* ... existing time adjust modal code ... */}
      </Modal>
      
      {/* Pledge Modal */}
      <Modal
        visible={showPledgeModal}
        transparent={true}
        animationType="fade"
      >
        {/* ... existing pledge modal code ... */}
      </Modal>
      
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiCannon
          count={100}
          origin={{x: width / 2, y: height}}
          autoStart={true}
          fadeOut={true}
          onAnimationEnd={handleConfettiFinish}
          key={confettiKey}
        />
      )}
      
      {/* Banner Notifications */}
      <BannerNotification 
        visible={bannerMessage !== ''} 
        message={bannerMessage}
        type={bannerType}
        onClose={() => setBannerMessage('')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 150,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  logoEmoji: {
    fontSize: 30,
    
  },
  logoText: {
    fontSize: 18,
    color: '#000000',
    fontFamily: typography.fonts.bold,
    marginLeft: 3,
    letterSpacing: 1,
  },
  iconButton: {
    padding: 8,
  },
  userGreeting: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    color: '#232323',
    marginBottom: 20,
    marginTop: 10,
  },
  timerCardContainer: {
    marginBottom: 20,
  },
  timerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15, // Consistent padding
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 5,
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  timerHeaderTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#232323',
  },
  startDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  startDateText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginRight: 4,
  },
  startDateContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  startDateLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#666666',
    textAlign: 'center',
  },
  timerCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timerCircle: {
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: (width * 0.8) / 2,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(76, 175, 80, 0.3)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.8,
    shadowRadius: 16,
    elevation: 10,
  },
  timeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeUnitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  smallUnitsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
  },
  timeUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginHorizontal: 4,
  },
  largeTimeValue: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
  },
  smallTimeValue: {
    fontSize: 24,
    fontFamily: typography.fonts.semibold,
    color: '#FFFFFF',
  },
  timeUnitLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.85)',
    marginLeft: 4,
  },
  unitSeparator: {
    fontSize: 24,
    fontFamily: typography.fonts.regular,
    color: 'rgba(255, 255, 255, 0.6)',
    marginHorizontal: 2,
  },
  resetButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    overflow: 'hidden',
  },
  resetButtonText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginHorizontal: 0,
    marginBottom: 5,
  },
  actionButtonWrapper: {
    width: '23.5%', // Adjusted width for proper spacing
    alignItems: 'center',
  },
  actionButton: {
    width: '100%',
  },
  actionButtonInner: {
    position: 'relative',
    backgroundColor: 'rgba(240, 255, 240, 0.95)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 0, // No horizontal padding
    minWidth: 75, // Ensure minimum width
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  checkinButton: {
    backgroundColor: 'rgba(240, 255, 240, 0.95)',
  },
  sosButton: {
    backgroundColor: 'rgba(255, 240, 240, 0.95)',
  },
  actionButtonText: {
    fontSize: 13,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginTop: 8,
  },
  pointsIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  pointsIndicatorText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  levelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  levelSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeContainer: {
    marginRight: 16,
  },
  levelBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(76, 175, 80, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  levelNumber: {
    fontSize: 28,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
  },
  levelDetails: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#232323',
    marginBottom: 8,
  },
  levelProgressContainer: {
    width: '100%',
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 4,
    marginBottom: 6,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  pointsText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  pointsInfoContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  pointsInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  pointsInfoText: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#555555',
    marginLeft: 8,
    flex: 1,
  },
  pointsInfoTextContainer: {
    flex: 1,
  },
  cooldownText: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#FF7B9C',
  },
  availableText: {
    fontSize: 12,
    fontFamily: typography.fonts.regular,
    color: '#4CAF50',
  },
  viewPointsButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewPointsText: {
    fontSize: 15,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    marginRight: 4,
  },
  benefitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#232323',
  },
  refreshContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  refreshText: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  benefitIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: '#232323',
  },
  benefitPercent: {
    fontSize: 15,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  achievementsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: '#4CAF50',
    marginRight: 2,
  },
  achievementsList: {
    paddingVertical: 10,
  },
  achievementItem: {
    alignItems: 'center',
    marginRight: 20,
    width: 70,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    position: 'relative',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  checkmarkBadge: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  achievementName: {
    fontSize: 13,
    color: '#333333',
    textAlign: 'center',
    fontFamily: typography.fonts.medium,
    marginBottom: 4,
    width: '100%',
  },
  achievementDay: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontFamily: typography.fonts.regular,
  },
  moneySavedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  editButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButtonText: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: '#666666',
  },
  moneySavedTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  currencySymbol: {
    fontSize: 26,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
    marginRight: 4,
  },
  moneySavedValue: {
    fontSize: 42,
    fontFamily: typography.fonts.bold,
    color: '#4CAF50',
  },
  projectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  projectionItem: {
    alignItems: 'center',
  },
  projectionLabel: {
    fontSize: 14,
    fontFamily: typography.fonts.regular,
    color: '#666666',
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#232323',
  },
  floatingButtonsContainer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  panicButton: {
    backgroundColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(244, 67, 54, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  panicButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  
  // ... additional styles for modals ...
  
  progressRingSvg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
    shadowColor: 'rgba(255, 255, 255, 0.5)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  emojiIcon: {
    fontSize: 22,
  },
  dividerLine: {
    height: 1,
    backgroundColor: 'rgba(200, 200, 200, 0.3)',
    marginVertical: 15,
    marginHorizontal: -15,
    borderRadius: 0,
  },
});

export default MainScreen; 