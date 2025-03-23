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
  TextInput,
  ActivityIndicator,
  Alert
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

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.65;
const STROKE_WIDTH = 14;
const PULSE_DURATION = 2000;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const logoScale = useSharedValue(1);
  
  // Add userName state
  const [userName, setUserName] = useState('');
  const [userPoints, setUserPoints] = useState(0);
  const [userLevel, setUserLevel] = useState(1);

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
  
  // Animated props for the progress circle
  const progressCircleProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * ((CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2);
    const strokeDashoffset = circumference * (1 - progressAnimation.value);
    return {
      strokeDashoffset: strokeDashoffset,
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
        await updateDoc(userDocRef, {
          streak_start_time: relapseTime,
          last_sync_time: relapseTime,
          relapse_history: arrayUnion({
            timestamp: relapseTime,
            previous_streak: timeElapsed
          })
        });
      }
      
      // Navigate to relapse screen
    router.push('/(standalone)/relapse');
    } catch (error) {
      console.error('Error saving relapse time:', error);
    }
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

  // Calculate lung recovery progress (0-100%)
  const calculateLungProgress = () => {
    // 30 days for significant lung recovery
    const totalDays = 30;
    const currentDays = timeElapsed.days;
    
    // Cap at 100%
    const progress = Math.min(currentDays / totalDays, 1) * 100;
    return Math.floor(progress);
  };

  // Calculate sleep recovery progress (0-100%)
  const calculateSleepProgress = () => {
    // 14 days for sleep pattern normalization
    const totalDays = 14;
    const currentDays = timeElapsed.days;
    
    // Cap at 100%
    const progress = Math.min(currentDays / totalDays, 1) * 100;
    return Math.floor(progress);
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
      // Only award points if user is authenticated
      if (!isFirebaseInitialized() || !auth.currentUser) {
        return;
      }
      
      const userId = auth.currentUser.uid;
      const lastLoginKey = `last_login_${userId}`;
      
      // Check if we already awarded points today
      const lastLoginStr = await AsyncStorage.getItem(lastLoginKey);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      
      if (lastLoginStr) {
        const lastLogin = parseInt(lastLoginStr);
        // If last login was today, don't award again
        if (lastLogin >= today) {
          // Still refresh points and level to ensure UI is up to date
          await loadUserPointsAndLevel();
          return;
        }
      }
      
      // Award daily login points
      const pointsResult = await awardDailyLoginPoints(userId);
      
      // If successful, update last login date
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
        
        // If user leveled up, show a notification
        if (pointsResult.leveledUp) {
          // Show level up notification
          Alert.alert(
            '🎉 Level Up!',
            `Congratulations! You've reached Level ${pointsResult.levelInfo.level}!`,
            [{ text: 'OK' }]
          );
        } else {
          // Show points notification if no level up
          Alert.alert(
            '🌟 Daily Login Bonus',
            'You earned 5 points for logging in today!',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error awarding daily login points:', error);
    }
  };

  // Add useEffect to check for daily login
  useEffect(() => {
    const checkLogin = async () => {
      if (isFirebaseInitialized() && auth.currentUser) {
        await checkAndAwardDailyLoginPoints();
      }
    };
    
    checkLogin();
  }, [auth.currentUser?.uid]); // Add dependency on user ID

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
    
    // Create the user document with onboarding state
    await setDoc(doc(db, 'users', auth.currentUser.uid), {
      streak_start_time: streakStartTime ? parseInt(streakStartTime, 10) : null,
      last_sync_time: new Date().getTime(),
      onboarding_completed: onboardingCompleted === 'true',
      questions_completed: onboardingCompleted === 'true',
      payment_completed: onboardingCompleted === 'true',
      onboarding_state: onboardingCompleted === 'true' ? 'completed' : 'pending'
    });
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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Background gradient that stays at the top */}
      <View style={styles.backgroundGradient}>
      <LinearGradient
          colors={['#A5D6A7', '#E8F5E9', '#F5F5F5']}
          style={{height: 250}}
        start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          locations={[0, 0.7, 1]}
        />
      </View>
      
      {/* Light gray background for the rest of the screen */}
      <View style={[StyleSheet.absoluteFill, {backgroundColor: '#F5F5F5', zIndex: -2}]} />
      
      {/* Time Adjust Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showTimeAdjustModal}
        onRequestClose={() => setShowTimeAdjustModal(false)}
      >
        <View style={styles.timeAdjustModalOverlay}>
          <View style={styles.timeAdjustModalContent}>
            <Text style={styles.timeAdjustModalTitle}>Adjust Time</Text>
            <ScrollView style={styles.timeUnitsScrollView}>
              {[
                { label: 'Years', key: 'years' },
                { label: 'Months', key: 'months' },
                { label: 'Weeks', key: 'weeks' },
                { label: 'Days', key: 'days' },
                { label: 'Hours', key: 'hours' },
                { label: 'Minutes', key: 'minutes' }
              ].map((unit) => (
                <View key={unit.key} style={styles.timeUnitInputRow}>
                  <Text style={styles.timeUnitLabel}>{unit.label}</Text>
                  <TextInput
                    style={styles.timeAdjustInput}
                    value={adjustedTime[unit.key]}
                    onChangeText={(value) => handleTimeUnitChange(unit.key, value)}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor="#999"
                    maxLength={4}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.timeAdjustButtonRow}>
              <TouchableOpacity 
                style={[styles.modalTimeAdjustButton, styles.timeAdjustCancelButton]}
                onPress={() => {
                  setShowTimeAdjustModal(false);
                  setAdjustedTime({
                    years: '0',
                    months: '0',
                    weeks: '0',
                    days: '0',
                    hours: '0',
                    minutes: '0'
                  });
                }}
              >
                <Text style={[styles.timeAdjustButtonText, styles.timeAdjustCancelText]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalTimeAdjustButton, styles.timeAdjustConfirmButton]}
                onPress={handleTimeAdjust}
              >
                <Text style={[styles.timeAdjustButtonText, styles.timeAdjustConfirmText]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
          <Text style={styles.logoEmoji}>🌿</Text>
          <Text style={styles.logoText}>T-BREAK</Text>
        </View>
            <TouchableOpacity
          style={styles.timeAdjustButton}
          onPress={() => setShowTimeAdjustModal(true)}
        >
          <Ionicons name="time-outline" size={20} color="#000000" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70, paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* User Greeting - Enhanced styling with emoji */}
        <Text style={styles.userGreeting}>Hello, Rob 👋</Text>
        
        {/* Timer Display - Modified to show time unit labels next to the values */}
        <View style={styles.timerContainer}>
          {/* Timer Content Box */}
          <View style={styles.timerContentBox}>
            {/* Title Bar */}
            <View style={styles.timerTitleBar}>
              <Text style={styles.timerTitle}>Sobriety Tracker</Text>
            </View>
            
            {/* Top section with circle */}
            <View style={styles.timerTopSection}>
              {/* Timer circle */}
              <View style={styles.circleWrapper}>
                <Animated.View style={[styles.circleContainer, pulseStyle]}>
                  <Svg width={CIRCLE_SIZE * 0.7} height={CIRCLE_SIZE * 0.7} style={styles.svg}>
                    <Defs>
                      <SvgGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#4CAF50" stopOpacity="1" />
                        <Stop offset="50%" stopColor="#2E7D32" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#1B5E20" stopOpacity="1" />
                      </SvgGradient>
                      <SvgGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#E8F5E9" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#C8E6C9" stopOpacity="0.8" />
                      </SvgGradient>
                      <SvgGradient id="glowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.3" />
                        <Stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                      </SvgGradient>
                      <SvgGradient id="resetButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F8F8F8" stopOpacity="1" />
                      </SvgGradient>
                      <SvgGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
                        <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.3)" />
                        <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
                      </SvgGradient>
                    </Defs>
                    
                    {/* Outer glow effect with animation */}
                    <Animated.View style={glowStyle}>
                      <Circle
                        cx={CIRCLE_SIZE * 0.35}
                        cy={CIRCLE_SIZE * 0.35}
                        r={(CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2 + 12}
                        stroke="url(#glowGradient)"
                        strokeWidth={24}
                        fill="transparent"
                      />
                    </Animated.View>
                    
                    {/* Background Circle with subtle gradient */}
                    <Circle
                      cx={CIRCLE_SIZE * 0.35}
                      cy={CIRCLE_SIZE * 0.35}
                      r={(CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2}
                      stroke="url(#bgGradient)"
                      strokeWidth={STROKE_WIDTH}
                      fill="transparent"
                      strokeLinecap="round"
                    />
                    
                    {/* Shimmer effect overlay */}
                    <Circle
                      cx={CIRCLE_SIZE * 0.35}
                      cy={CIRCLE_SIZE * 0.35}
                      r={(CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2}
                      stroke="url(#shimmerGradient)"
                      strokeWidth={STROKE_WIDTH}
                      fill="transparent"
                      strokeLinecap="round"
                      opacity={0.4}
                    />
                    
                    {/* Progress Circle with gradient */}
                    <AnimatedCircle
                      cx={CIRCLE_SIZE * 0.35}
                      cy={CIRCLE_SIZE * 0.35}
                      r={(CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2}
                      stroke="url(#progressGradient)"
                      strokeWidth={STROKE_WIDTH}
                      strokeLinecap="round"
                      fill="transparent"
                      strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2)}`}
                      animatedProps={progressCircleProps}
                      transform={`rotate(-90 ${CIRCLE_SIZE * 0.35} ${CIRCLE_SIZE * 0.35})`}
                    />
                  </Svg>
                  
                  {/* Center Emoji without container */}
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={handleRefreshPress}
                    onPressIn={handleRefreshPressIn}
                    onPressOut={handleRefreshPressOut}
                    activeOpacity={0.9}
                  >
                    <Animated.View style={[refreshIconStyle, refreshButtonStyle]}>
                      <Ionicons name="refresh" size={28} color="#43A047" />
                    </Animated.View>
            </TouchableOpacity>
                </Animated.View>
              </View>
              
              {/* Timer Label */}
              <Text style={styles.timerLabel}>
                You've been cannabis-free for:
              </Text>
            </View>
            
            {/* Divider */}
            <View style={styles.timerDivider} />
            
            {/* Swipeable Container */}
            <View style={styles.swipeableContainer}>
              <Animated.View style={[styles.swipeableView, timerViewStyle]}>
                {/* Main Time Display - Show large units (days and above) */}
                <View style={styles.mainTimeDisplayScroll}>
                  <View style={styles.mainTimeDisplay}>
                    {(() => {
                      const { largeUnits } = getFormattedTimeUnits();
                      
                      if (largeUnits.length === 0) {
                        return (
                          <View style={styles.mainTimeUnit}>
                            <Text style={styles.timeUnitInline}>
                              <Text style={styles.timeUnitValue}>0</Text>
                              <Text style={styles.timeUnitLabelInline}>min</Text>
                            </Text>
                          </View>
                        );
                      }
                      
                      return (
                        <View style={styles.largeUnitsContainer}>
                          {largeUnits.map((unit, index) => (
                            <View key={index} style={[
                              styles.largeUnitItem,
                              largeUnits.length <= 2 ? styles.largeUnitItemWide : {}
                            ]}>
                              <Text style={styles.timeUnitInline}>
                                <Text style={styles.timeUnitValue}>{unit.value}</Text>
                                <Text style={styles.timeUnitLabelInline}>
                                  {unit.label === 'hours' || unit.label === 'hour' ? ' hour' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'minutes' || unit.label === 'minute' ? ' min' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'seconds' || unit.label === 'second' ? ' sec' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'days' || unit.label === 'day' ? ' day' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'weeks' || unit.label === 'week' ? ' week' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'months' || unit.label === 'month' ? ' month' + (unit.value !== 1 ? 's' : '') : 
                                   unit.label === 'years' || unit.label === 'year' ? ' year' + (unit.value !== 1 ? 's' : '') : 
                                   ' ' + unit.label}
                                </Text>
                              </Text>
                            </View>
          ))}
        </View>
                      );
                    })()}
                  </View>
                </View>
              </Animated.View>
              
              <Animated.View style={[styles.swipeableView, styles.startDateView, startDateViewStyle]}>
                <Text style={styles.startDateText}>{formatStartDate()}</Text>
              </Animated.View>
              
              {/* Swipe Gesture Handlers */}
              <View style={styles.swipeGestureArea}>
                <TouchableOpacity 
                  style={styles.swipeLeftButton} 
                  onPress={() => handleSwipe('right')}
                  activeOpacity={0.6}
                >
                  <Ionicons name="chevron-back" size={20} color={!showStartDate ? "#CCCCCC" : "#4CAF50"} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.swipeRightButton} 
                  onPress={() => handleSwipe('left')}
                  activeOpacity={0.6}
                >
                  <Ionicons name="chevron-forward" size={20} color={showStartDate ? "#CCCCCC" : "#4CAF50"} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Small Units Display (hours, minutes, seconds) */}
            <View style={styles.secondsBoxContainer}>
            <LinearGradient
                colors={['#43A047', '#2E7D32']}
                style={styles.smallUnitsGradient}
              start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.smallUnitsDisplay}>
                  {(() => {
                    const { smallUnits } = getFormattedTimeUnits();
                    
                    return (
                      <Text style={styles.smallUnitsText}>
                        {smallUnits.map((unit, index) => (
                          <React.Fragment key={index}>
                            <Text style={styles.smallUnitValue}>{parseInt(unit.value, 10)}</Text>
                            <Text style={styles.smallUnitLabel}>{unit.label}</Text>
                            {index < smallUnits.length - 1 && <Text style={styles.smallUnitSpacer}> </Text>}
                          </React.Fragment>
                        ))}
                      </Text>
                    );
                  })()}
                </View>
              </LinearGradient>
            </View>
            
            {/* Points and Level Display */}
            <View style={styles.pointsLevelContainer}>
              <View style={styles.pointsContainer}>
                <Ionicons name="star" size={22} color="#FFD700" />
                <Text style={styles.pointsText}>{userPoints} pts</Text>
              </View>
              <View style={styles.levelContainer}>
                <Ionicons name="trophy" size={22} color="#4CAF50" />
                <Text style={styles.levelText}>Level {userLevel}</Text>
              </View>
            </View>
          </View>
          
          {/* Swipe Indicator - Moved outside the box */}
          <View style={styles.swipeIndicatorContainer}>
            <View style={[styles.swipeIndicatorDot, !showStartDate && styles.swipeIndicatorActive]} />
            <View style={[styles.swipeIndicatorDot, showStartDate && styles.swipeIndicatorActive]} />
          </View>
        </View>
        
        {/* Recovery Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recovery</Text>
        </View>
        
        {/* Brain Rewiring Progress Bar */}
        <View style={styles.brainProgressContainer}>
          <TouchableOpacity
            style={styles.brainProgressCard}
            activeOpacity={0.9}
          >
            <View style={styles.brainProgressHeader}>
              <View style={styles.headerWithEmojiRow}>
                <Text style={styles.headerEmoji}>🧠</Text>
                <Text style={styles.brainProgressTitle}>Brain Healing</Text>
              </View>
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
          
        {/* Lung Recovery Progress Bar */}
        <View style={styles.brainProgressContainer}>
          <TouchableOpacity
            style={styles.brainProgressCard}
            activeOpacity={0.9}
          >
            <View style={styles.brainProgressHeader}>
              <View style={styles.headerWithEmojiRow}>
                <Text style={styles.headerEmoji}>🫁</Text>
                <Text style={styles.brainProgressTitle}>Lung Recovery</Text>
              </View>
              <Text style={styles.brainProgressPercent}>{calculateLungProgress()}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${calculateLungProgress()}%` }
                  ]} 
                />
          </View>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Sleep Recovery Progress Bar */}
        <View style={styles.brainProgressContainer}>
          <TouchableOpacity
            style={styles.brainProgressCard}
            activeOpacity={0.9}
          >
            <View style={styles.brainProgressHeader}>
              <View style={styles.headerWithEmojiRow}>
                <Text style={styles.headerEmoji}>😴</Text>
                <Text style={styles.brainProgressTitle}>Sleep Recovery</Text>
              </View>
              <Text style={styles.brainProgressPercent}>{calculateSleepProgress()}%</Text>
            </View>
            
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${calculateSleepProgress()}%` }
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
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => handleButtonPress('meditate')}
            >
              <View style={styles.buttonInnerContainer}>
                <Text style={styles.buttonEmoji}>🧘</Text>
                <Text style={styles.buttonText} numberOfLines={1}>Meditate</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => handleButtonPress('pledge')}
            >
              <View style={styles.buttonInnerContainer}>
                <Text style={styles.buttonEmoji}>🙏</Text>
                <Text style={styles.buttonText} numberOfLines={1}>Pledge</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => handleButtonPress('journal')}
            >
              <View style={styles.buttonInnerContainer}>
                <Text style={styles.buttonEmoji}>📓</Text>
                <Text style={styles.buttonText} numberOfLines={1}>Journal</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              activeOpacity={0.7}
              onPress={() => handleButtonPress('more')}
            >
              <View style={styles.buttonInnerContainer}>
                <Text style={styles.buttonEmoji}>⚙️</Text>
                <Text style={styles.buttonText} numberOfLines={1}>More</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CCCCCC" />
            </TouchableOpacity>
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
    backgroundColor: 'transparent',
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
  timerContainer: {
    alignItems: 'center',
    marginBottom: 0,
    marginTop: 0,
    width: '100%',
    paddingHorizontal: 0,
  },
  timerContentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    width: '100%',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
    marginTop: 0,
    borderWidth: 0,
    marginHorizontal: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  timerTitleBar: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 16,
    fontFamily: typography.fonts.semibold,
    color: '#222222',
    letterSpacing: 0.5,
  },
  timerTopSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 28,
    paddingBottom: 20,
    marginTop: 0,
  },
  timerDivider: {
    width: '85%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 16,
    marginTop: 6,
  },
  timerLabel: {
    fontSize: 17,
    color: '#333333',
    fontFamily: typography.fonts.semibold,
    marginTop: 14,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 6,
  },
  circleContainer: {
    width: CIRCLE_SIZE * 0.75,
    height: CIRCLE_SIZE * 0.75,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(76, 175, 80, 0.15)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  svg: {
    position: 'absolute',
  },
  mainTimeDisplayScroll: {
    flexGrow: 0,
    justifyContent: 'center',
    paddingHorizontal: 4,
    width: '100%',
    marginBottom: 20,
    marginTop: 4,
  },
  mainTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    flexWrap: 'nowrap',
    paddingHorizontal: 2,
  },
  mainTimeUnit: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  largeUnitsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    paddingHorizontal: 2,
    overflow: 'hidden',
  },
  largeUnitItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
    minWidth: 65,
    maxWidth: 150,
  },
  largeUnitItemWide: {
    minWidth: 85,
  },
  timeUnitInline: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'nowrap',
  },
  timeUnitValue: {
    fontSize: 46,
    color: '#222222',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    adjustsFontSizeToFit: true,
    numberOfLines: 1,
    includeFontPadding: false,
    textShadowColor: 'rgba(76, 175, 80, 0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: -0.5,
    lineHeight: 50,
    marginBottom: 2,
  },
  timeUnitLabelInline: {
    fontSize: 18,
    color: '#777777',
    fontFamily: typography.fonts.medium,
    marginLeft: 1,
    marginBottom: 4,
    flexShrink: 1,
  },
  secondsBoxContainer: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  smallUnitsGradient: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    width: '100%',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  smallUnitsDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.25)',
  },
  smallUnitsText: {
    textAlign: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  smallUnitValue: {
    fontSize: 19,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  smallUnitLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    marginRight: 8,
  },
  smallUnitSpacer: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginRight: 6,
    marginLeft: 4,
  },
  refreshButton: {
    width: STROKE_WIDTH * 3.6,
    height: STROKE_WIDTH * 3.6,
    borderRadius: STROKE_WIDTH * 1.8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    position: 'absolute',
  },
  resetEmoji: {
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 0,
    color: '#43A047',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 2,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.semibold,
    color: '#000000',
    marginLeft: 5,
    letterSpacing: 0.3,
  },
  buttonGrid: {
    marginBottom: 20,
    marginTop: 10,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  actionButton: {
    width: '48.5%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 16,
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  buttonInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '80%',
  },
  buttonEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: '#333333',
    fontFamily: typography.fonts.semibold,
    letterSpacing: 0,
    maxWidth: '70%',
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
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(255, 59, 48, 0.06)',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 6,
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
    marginRight: 12,
  },
  panicButtonText: {
    color: '#FF3B30',
    fontSize: 17,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  brainProgressContainer: {
    marginBottom: 8,
    width: '100%',
  },
  brainProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    paddingTop: 14,
    shadowColor: 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    width: '100%',
    position: 'relative',
  },
  brainProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 0,
    paddingRight: 4,
  },
  brainProgressTitle: {
    fontSize: 15,
    fontFamily: typography.fonts.semibold,
    color: '#444444',
  },
  brainProgressPercent: {
    fontSize: 17,
    fontFamily: typography.fonts.bold,
    color: '#3AAF3C',
  },
  progressBarContainer: {
    height: 10,
    width: '100%',
    marginBottom: 2,
  },
  progressBarBackground: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  timeAdjustModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeAdjustModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 350,
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.12)',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 5,
  },
  timeAdjustModalTitle: {
    fontSize: 18,
    fontFamily: typography.fonts.bold,
    color: '#333',
    marginBottom: 15,
  },
  timeUnitsScrollView: {
    width: '100%',
    maxHeight: 300,
  },
  timeUnitInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  timeAdjustInput: {
    width: '65%',
    height: 45,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    fontFamily: typography.fonts.medium,
    backgroundColor: '#FAFAFA',
  },
  timeAdjustButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalTimeAdjustButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  timeAdjustCancelButton: {
    backgroundColor: '#F5F5F5',
  },
  timeAdjustConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  timeAdjustButtonText: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
  timeAdjustCancelText: {
    color: '#666',
  },
  timeAdjustConfirmText: {
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 20,
    fontFamily: typography.fonts.bold,
    color: '#333',
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 16,
    fontFamily: typography.fonts.regular,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
  userGreeting: {
    fontSize: 34,
    fontFamily: typography.fonts.bold,
    color: '#000000',
    marginBottom: 24,
    paddingHorizontal: 5,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  swipeableContainer: {
    width: '100%',
    height: 120,
    position: 'relative',
    overflow: 'hidden',
  },
  swipeableView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  startDateView: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  startDateText: {
    fontSize: 19,
    fontFamily: typography.fonts.medium,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 30,
  },
  swipeIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 8,
    marginTop: 4,
  },
  swipeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 5,
  },
  swipeIndicatorActive: {
    backgroundColor: '#4CAF50',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  swipeGestureArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    zIndex: 1,
  },
  swipeLeftButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeRightButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerWithEmojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 2,
  },
  headerEmoji: {
    fontSize: 22,
    marginRight: 8,
  },
  timeAdjustButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: -1,
  },
  pointsLevelContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 24,
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsText: {
    fontSize: 14,
    fontFamily: typography.fonts.semiBold,
    color: '#000000',
    marginLeft: 4,
  },
  levelText: {
    fontSize: 14,
    fontFamily: typography.fonts.semiBold,
    color: '#000000',
    marginLeft: 4,
  },
});

export default MainScreen; 