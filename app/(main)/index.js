import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import LottieAnimation from '../../src/components/LottieAnimation';
import { colors } from '../styles/colors';

const MainScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isVideoReady, setIsVideoReady] = useState(false);

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
    router.push('/(standalone)/relapse');
  };

  const handleButtonPress = (type) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Fade in animation when video is ready
  useEffect(() => {
    if (isVideoReady) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }
  }, [isVideoReady]);

  return (
    <View style={styles.container}>
      {/* Background Video */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Video
          source={require('../../app/Backgrounds/UpdatedBackground.mp4')}
          style={StyleSheet.absoluteFill}
          shouldPlay
          isLooping
          isMuted
          rate={0.5}
          resizeMode="cover"
          onReadyForDisplay={() => setIsVideoReady(true)}
        />
      </Animated.View>
      
      <ScrollView 
        style={[styles.scrollContainer, { backgroundColor: 'transparent' }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {/* Logo and Broccoli Text */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/images/broccoli-logo.png')}
            style={styles.logo}
          />
          <Text style={styles.broccoliText}>BROCCOLI</Text>
        </View>

        {/* Animated Ball and Timer */}
        <View style={styles.headerSection}>
          <LottieAnimation />
          <Text style={styles.timerLabel}>You've been cannabis-free for:</Text>
          <View style={styles.timerContainer}>
            <Text style={styles.timer}>
              {timeElapsed.hours > 0 ? `${timeElapsed.hours}hr ` : ''}
              {(timeElapsed.hours > 0 || timeElapsed.minutes > 0) ? `${timeElapsed.minutes}m ` : ''}
            </Text>
            <View style={[styles.secondsContainer, { alignSelf: 'center', marginLeft: 8 }]}>
              <Text style={styles.seconds}>{timeElapsed.seconds}s</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable style={styles.circleButton} onPress={() => handleButtonPress('pledged')}>
            <Ionicons name="hand-left" size={20} color="white" />
            <Text style={styles.buttonText}>Pledge</Text>
          </Pressable>
          <Pressable 
            style={styles.circleButton} 
            onPress={() => {
              handleButtonPress('meditate');
              router.push('/(standalone)/meditate');
            }}
          >
            <Ionicons name="leaf" size={20} color="white" />
            <Text style={styles.buttonText}>Meditate</Text>
          </Pressable>
          <Pressable style={styles.circleButton} onPress={handleReset}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.buttonText}>Reset</Text>
          </Pressable>
          <Pressable style={styles.circleButton} onPress={() => handleButtonPress('more')}>
            <Ionicons name="ellipsis-horizontal" size={20} color="white" />
            <Text style={styles.buttonText}>More</Text>
          </Pressable>
        </View>

        {/* Interactive Cards */}
        <Pressable 
          style={styles.card}
          onPress={() => router.push('/(main)/recovery')}
        >
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Recovery Progress</Text>
            <Text style={styles.cardSubtitle}>
              Track your lung health and recovery milestones
            </Text>
          </View>
          <Ionicons name="fitness-outline" size={24} color="white" />
        </Pressable>

        <Pressable style={styles.card}>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Join Community</Text>
            <Text style={styles.cardSubtitle}>
              Connect with others on their cannabis-free journey
            </Text>
          </View>
          <Ionicons name="chatbubbles-outline" size={24} color="white" />
        </Pressable>

        {/* Tracking Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Estimated lung recovery</Text>
            <Text style={styles.statValue}>35%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Money Saved</Text>
            <Text style={styles.statValue}>$420</Text>
          </View>
        </View>

        {/* Quitting Reason */}
        <Pressable style={styles.reasonCard}>
          <Text style={styles.reasonPrompt}>
            Click here to add a reason why you're quitting cannabis
          </Text>
          <Text style={styles.bestStreak}>🏆 Best 17hr 8m</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 61,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  logo: {
    flex: 1,
    aspectRatio: 3,
    resizeMode: 'contain',
    height: 24,
    width: 24,
  },
  broccoliText: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerLabel: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.text.primary,
  },
  secondsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  seconds: {
    fontSize: 16,
    color: colors.text.primary,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  circleButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 11,
    marginTop: 6,
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  reasonCard: {
    backgroundColor: colors.background.card,
    padding: 16,
    borderRadius: 16,
  },
  reasonPrompt: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  bestStreak: {
    fontSize: 14,
    color: colors.text.primary,
  },
});

export default MainScreen; 