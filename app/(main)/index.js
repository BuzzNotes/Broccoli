import React, { useEffect, useState } from 'react';
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
  TouchableOpacity
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
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieAnimation from '../../src/components/LottieAnimation';
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

  // Update Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newSeconds = prev.seconds + 1;
        if (newSeconds === 60) {
          const newMinutes = prev.minutes + 1;
          if (newMinutes === 60) {
            return {
              hours: prev.hours + 1,
              minutes: 0,
              seconds: 0
            };
          }
          return {
            ...prev,
            minutes: newMinutes,
            seconds: 0
          };
        }
        return {
          ...prev,
          seconds: newSeconds
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Initialize timer
  const initializeTimer = async () => {
    try {
      const startTimeStr = await AsyncStorage.getItem('streakStartTime');
      if (!startTimeStr) {
        router.replace('/(standalone)/start-streak');
        return;
      }
      
      const startTime = parseInt(startTimeStr, 10);
      const currentTime = new Date().getTime();
      const elapsedMs = currentTime - startTime;
      
      const hours = Math.floor(elapsedMs / (1000 * 60 * 60));
      const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      setTimeElapsed({ hours, minutes, seconds });
    } catch (error) {
      console.error('Error initializing timer:', error);
    }
  };

  useEffect(() => {
    initializeTimer();
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
      // Handle pledge action
    } else if (type === 'journal') {
      // Handle journal action
    } else if (type === 'more') {
      // Handle more options
    }
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

  // Format time for display
  const formatTime = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced green gradient background */}
      <LinearGradient
        colors={['#0F1A15', '#122A1E', '#0F1A15']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Animated.Image 
            source={require('../../assets/images/broccoli-logo.png')}
            style={[styles.logo, logoAnimatedStyle]}
          />
          <Text style={styles.logoText}>BROCCOLI</Text>
        </View>
        
        {/* Lottie Animation */}
        <View style={styles.animationContainer}>
          <LottieAnimation />
        </View>
        
        {/* Timer Section - More modest size */}
        <View style={styles.timerSection}>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>
              {formatTime(timeElapsed.hours)}:{formatTime(timeElapsed.minutes)}
              <Text style={styles.timerSeconds}>{formatTime(timeElapsed.seconds)}</Text>
            </Text>
          </View>
          
          <View style={styles.timerLabel}>
            <Ionicons name="leaf" size={16} color="#4FA65B" style={styles.leafIcon} />
            <Text style={styles.timerLabelText}>Cannabis-Free</Text>
          </View>
          
          {/* Reset Button - Refined with depth */}
          <Pressable 
            style={({ pressed }) => [
              styles.resetButton,
              pressed && { transform: [{ scale: 0.98 }] }
            ]}
            onPress={handleReset}
          >
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.2)', 'rgba(79, 166, 91, 0.1)']}
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
                colors={['rgba(79, 166, 91, 0.3)', 'rgba(79, 166, 91, 0.1)']}
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
                color="#4FA65B" 
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
        style={[styles.panicButton, { bottom: insets.bottom + 70 }]} 
        activeOpacity={0.9}
        onPress={handlePanicButtonPress}
      >
        <LinearGradient
          colors={['#FF3B30', '#CC2D25']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <Ionicons name="alert-circle" size={20} color="#FFF" style={styles.panicIcon} />
        <Text style={styles.panicButtonText}>PANIC BUTTON</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1A15',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // Extra padding for tab bar
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  logoText: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginTop: 8,
    letterSpacing: 2,
  },
  animationContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginBottom: 24,
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: 36,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  timer: {
    fontSize: 56, // Reduced from 72
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  timerSeconds: {
    fontSize: 36, // Reduced from 48
    color: colors.text.secondary,
    fontFamily: typography.fonts.bold,
  },
  timerLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  leafIcon: {
    marginRight: 8,
  },
  timerLabelText: {
    fontSize: 16, // Reduced from 18
    color: colors.text.secondary,
    fontFamily: typography.fonts.bold,
  },
  resetButton: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    marginTop: 8,
  },
  resetButtonBlur: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  resetButtonText: {
    color: colors.text.primary,
    fontSize: 15,
    fontFamily: typography.fonts.bold,
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
    borderColor: 'rgba(79, 166, 91, 0.3)',
    overflow: 'hidden',
    backgroundColor: 'rgba(15, 26, 21, 0.7)',
    shadowColor: '#4FA65B',
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
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
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
    borderColor: 'rgba(79, 166, 91, 0.3)',
    position: 'relative',
    shadowColor: '#4FA65B',
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
    fontFamily: typography.fonts.bold,
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
    left: 24,
    right: 24,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    overflow: 'hidden',
  },
  panicIcon: {
    marginRight: 8,
  },
  panicButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
});

export default MainScreen; 