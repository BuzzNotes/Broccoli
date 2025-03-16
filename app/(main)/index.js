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
  
  // Add new state for swipeable view
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
    
    // CASE 1: Less than 1 day - show hours and minutes in large, seconds in small
    if (totalDays === 0) {
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
      
      // Filter out zero values
      largeUnits = largeUnits.filter(unit => unit.value > 0);
      
      // If all large units are zero, show at least minutes
      if (largeUnits.length === 0) {
        largeUnits = [{
          value: 0,
          label: 'minutes'
        }];
      }
      
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
    
    // CASE 2: 1+ days but less than 7 days - show days and hours in large, minutes and seconds in small
    if (totalDays < 7) {
      largeUnits = [
        {
          value: totalDays,
          label: totalDays === 1 ? 'day' : 'days'
        },
        {
          value: totalHours,
          label: totalHours === 1 ? 'hour' : 'hours'
        }
      ];
      
      // Filter out zero values
      largeUnits = largeUnits.filter(unit => unit.value > 0);
      
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
    
    // CASE 3: 1+ weeks but less than 30 days - show weeks and days in large, hours, minutes, seconds in small
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
      
      // Filter out zero values
      largeUnits = largeUnits.filter(unit => unit.value > 0);
      
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
    
    // CASE 4: 1+ months but less than 365 days - show months, weeks, days in large (keeping to 3 max)
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
      
      // Filter out zero values
      largeUnits = largeUnits.filter(unit => unit.value > 0);
      
      // If we have less than 3 units after filtering and there are hours, add hours
      if (largeUnits.length < 3 && totalHours > 0) {
        largeUnits.push({
          value: totalHours,
          label: totalHours === 1 ? 'hour' : 'hours'
        });
      }
      
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
      
      // If hours is already in large units, remove it from small units
      if (largeUnits.some(unit => unit.label.includes('hour'))) {
        smallUnits = smallUnits.slice(1);
      }
      
      return {
        largeUnits,
        smallUnits
      };
    }
    
    // CASE 5: 1+ years - limit to 3 units in large display (years, months, weeks)
    // and move days to small units
    largeUnits = [
      {
        value: years,
        label: years === 1 ? 'year' : 'years'
      },
      {
        value: monthsAfterYears > 0 ? monthsAfterYears : 0,
        label: monthsAfterYears === 1 ? 'month' : 'months'
      },
      {
        value: weeksAfterMonthsAndYears > 0 ? weeksAfterMonthsAndYears : 0,
        label: weeksAfterMonthsAndYears === 1 ? 'week' : 'weeks'
      }
    ];
    
    // Filter out zero values
    largeUnits = largeUnits.filter(unit => unit.value > 0);
    
    smallUnits = [
      {
        value: daysAfterAll,
        label: daysAfterAll === 1 ? 'd' : 'd'
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
    
    // If days is zero, remove it from small units
    if (daysAfterAll === 0) {
      smallUnits = smallUnits.slice(1);
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
        router.replace('/(standalone)/start-streak');
        return null;
      }
      
      const startTime = parseInt(startTimeStr, 10);
      
      // Set the start date for display
      const startDateObj = new Date(startTime);
      setStartDate(startDateObj);
      
      // Initial update
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

  // Handle time adjustment
  const handleTimeAdjust = async () => {
    const now = new Date();
    const years = parseInt(adjustedTime.years, 10) || 0;
    const months = parseInt(adjustedTime.months, 10) || 0;
    const weeks = parseInt(adjustedTime.weeks, 10) || 0;
    const days = parseInt(adjustedTime.days, 10) || 0;
    const hours = parseInt(adjustedTime.hours, 10) || 0;
    const minutes = parseInt(adjustedTime.minutes, 10) || 0;

    // Calculate total milliseconds
    const totalMs = (
      years * 365 * 24 * 60 * 60 * 1000 +
      months * 30 * 24 * 60 * 60 * 1000 +
      weeks * 7 * 24 * 60 * 60 * 1000 +
      days * 24 * 60 * 60 * 1000 +
      hours * 60 * 60 * 1000 +
      minutes * 60 * 1000
    );

    const adjustedTimeMs = now.getTime() - totalMs;
    await AsyncStorage.setItem('streakStartTime', adjustedTimeMs.toString());
    
    // Restart timer with new start time
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Off-white background instead of pure white */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#EDF7ED', '#F5FAF5', '#FBFEFB']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>
      
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
          <Animated.Image 
            source={require('../../assets/images/broccoli-logo.png')}
            style={[styles.logo, logoAnimatedStyle]}
          />
          <Text style={styles.logoText}>BROCCOLI</Text>
        </View>
        <TouchableOpacity
          style={styles.timeAdjustButton}
          onPress={() => setShowTimeAdjustModal(true)}
        >
          <Ionicons name="time-outline" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 70, paddingBottom: 150 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* User Greeting - Hardcoded for testing */}
        <Text style={styles.userGreeting}>Hello, Rob</Text>
        
        {/* Timer Display - Modified to show time unit labels next to the values */}
        <View style={styles.timerContainer}>
          {/* Timer Content Box */}
          <View style={styles.timerContentBox}>
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
                        <Stop offset="0%" stopColor="#4CAF50" stopOpacity="0.25" />
                        <Stop offset="100%" stopColor="#4CAF50" stopOpacity="0" />
                      </SvgGradient>
                      <SvgGradient id="resetButtonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#F8F8F8" stopOpacity="1" />
                      </SvgGradient>
                    </Defs>
                    
                    {/* Outer glow effect with animation */}
                    <Animated.View style={glowStyle}>
                      <Circle
                        cx={CIRCLE_SIZE * 0.35}
                        cy={CIRCLE_SIZE * 0.35}
                        r={(CIRCLE_SIZE * 0.7 - STROKE_WIDTH) / 2 + 10}
                        stroke="url(#glowGradient)"
                        strokeWidth={20}
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
                    
                    {/* Center button shadow */}
                    <Circle
                      cx={CIRCLE_SIZE * 0.35}
                      cy={CIRCLE_SIZE * 0.35}
                      r={STROKE_WIDTH * 1.85}
                      fill="rgba(0, 0, 0, 0.02)"
                      stroke="transparent"
                    />
                    
                    {/* Center Icon Container with improved design */}
                    <Circle
                      cx={CIRCLE_SIZE * 0.35}
                      cy={CIRCLE_SIZE * 0.35}
                      r={STROKE_WIDTH * 1.8}
                      fill="url(#resetButtonGradient)"
                      stroke="rgba(76, 175, 80, 0.15)"
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
                            <Text style={styles.timeUnitValue} numberOfLines={1} adjustsFontSizeToFit>
                              0
                            </Text>
                            <Text style={styles.timeUnitLabel}>minutes</Text>
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
                              <Text 
                                style={styles.timeUnitValue} 
                                numberOfLines={1} 
                                adjustsFontSizeToFit
                              >
                                {unit.value}
              </Text>
                              <Text style={styles.timeUnitLabel}>
                                {unit.label}
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
          </View>
          
          {/* Swipe Indicator - Moved outside the box */}
          <View style={styles.swipeIndicatorContainer}>
            <View style={[styles.swipeIndicatorDot, !showStartDate && styles.swipeIndicatorActive]} />
            <View style={[styles.swipeIndicatorDot, showStartDate && styles.swipeIndicatorActive]} />
          </View>
        </View>
        
        {/* Brain Rewiring Progress Bar */}
        <View style={styles.brainProgressContainer}>
          <TouchableOpacity
            style={styles.brainProgressCard}
            activeOpacity={0.9}
          >
            <View style={styles.brainProgressHeader}>
              <View style={styles.headerWithEmojiColumn}>
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
              <View style={styles.headerWithEmojiColumn}>
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
              <View style={styles.headerWithEmojiColumn}>
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
    marginBottom: 24,
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 0,
  },
  timerContentBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 0,
    width: '100%',
    alignItems: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 8,
    marginTop: 0,
    borderWidth: 0,
    marginHorizontal: 0,
    overflow: 'hidden',
    position: 'relative',
  },
  timerTopSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    marginTop: 0,
  },
  timerDivider: {
    width: '92%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    marginBottom: 10,
  },
  timerLabel: {
    fontSize: 16,
    color: '#444444',
    fontFamily: typography.fonts.medium,
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
  },
  circleContainer: {
    width: CIRCLE_SIZE * 0.7,
    height: CIRCLE_SIZE * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(76, 175, 80, 0.1)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  svg: {
    position: 'absolute',
  },
  mainTimeDisplayScroll: {
    flexGrow: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
    width: '100%',
    marginBottom: 24,
  },
  mainTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    flexWrap: 'nowrap',
    paddingHorizontal: 5,
  },
  mainTimeUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeUnitsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexWrap: 'nowrap',
    width: '100%',
    paddingHorizontal: 5,
    overflow: 'hidden',
  },
  largeUnitItem: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 8,
    minWidth: 72,
    maxWidth: 100,
  },
  largeUnitItemWide: {
    minWidth: 95,
  },
  timeUnitValue: {
    fontSize: 60,
    color: '#222222',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    adjustsFontSizeToFit: true,
    numberOfLines: 1,
    includeFontPadding: false,
    textShadowColor: 'rgba(76, 175, 80, 0.05)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
    letterSpacing: -0.5,
    lineHeight: 64,
    marginBottom: 2,
  },
  timeUnitLabel: {
    fontSize: 14,
    color: '#888888',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    textTransform: 'lowercase',
    includeFontPadding: false,
    adjustsFontSizeToFit: true,
    numberOfLines: 1,
    letterSpacing: 0.2,
  },
  secondsBoxContainer: {
    marginBottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    width: '100%',
  },
  smallUnitsGradient: {
    borderRadius: 0,
    overflow: 'hidden',
    borderWidth: 0,
    width: '100%',
  },
  smallUnitsDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
  },
  smallUnitsText: {
    textAlign: 'center',
  },
  smallUnitValue: {
    fontSize: 19,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    textShadowColor: 'rgba(0, 0, 0, 0.12)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  smallUnitLabel: {
    fontSize: 15,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    opacity: 0.9,
    textShadowColor: 'rgba(0, 0, 0, 0.08)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 0,
    marginRight: 10,
  },
  smallUnitSpacer: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
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
  },
  sectionHeader: {
    marginBottom: 22,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: typography.fonts.bold,
    color: '#333333',
    marginLeft: 5,
    letterSpacing: 0.4,
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
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 16,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 4,
    borderWidth: 0,
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
    marginBottom: 12,
    width: '100%',
  },
  brainProgressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    paddingTop: 16,
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 18,
    elevation: 5,
    borderWidth: 0,
    width: '100%',
    position: 'relative',
  },
  brainProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingTop: 0,
    paddingRight: 8,
  },
  brainProgressTitle: {
    fontSize: 16,
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
  userGreeting: {
    fontSize: 30,
    fontFamily: typography.fonts.bold,
    color: '#333333',
    marginBottom: 18,
    paddingHorizontal: 5,
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
    fontSize: 18,
    fontFamily: typography.fonts.medium,
    color: '#444444',
    textAlign: 'center',
    lineHeight: 28,
  },
  swipeIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
    marginTop: 4,
  },
  swipeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DDDDDD',
    marginHorizontal: 4,
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
  headerWithEmojiColumn: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingLeft: 2,
    paddingRight: 8,
  },
  headerEmoji: {
    fontSize: 24,
    marginBottom: 6,
    paddingTop: 4,
    paddingBottom: 4,
  },
});

export default MainScreen; 