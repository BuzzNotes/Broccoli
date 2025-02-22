import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import LottieAnimation from '../../src/components/LottieAnimation';

const MainScreen = () => {
  // Timer State
  const [timeElapsed, setTimeElapsed] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // UI State
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [brainProgress] = useState(0);

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

  return (
    <View style={styles.container}>
      <LottieAnimation />

      {/* Timer */}
      <Text style={styles.timer}>
        {`${timeElapsed.hours}hr ${timeElapsed.minutes}m`}
      </Text>
      <Text style={styles.seconds}>{timeElapsed.seconds}s</Text>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.actionButton}
          onPress={() => handleButtonPress('pledged')}
        >
          <Ionicons name="hand-left" size={24} color="white" />
          <Text style={styles.buttonText}>Pledged</Text>
        </Pressable>
        <Pressable
          style={styles.actionButton}
          onPress={handleReset}
        >
          <Ionicons name="refresh" size={24} color="white" />
          <Text style={styles.buttonText}>Reset</Text>
        </Pressable>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressTitle}>Brain Rewiring</Text>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${brainProgress}%` }]} 
          />
        </View>
        <Text style={styles.progressText}>{brainProgress}%</Text>
      </View>

      {/* Notifications Section */}
      <Pressable 
        style={styles.settingRow}
        onPress={() => setNotificationsEnabled(!notificationsEnabled)}
      >
        <View style={styles.settingContent}>
          <Text style={styles.settingTitle}>Enable Notifications</Text>
          <Text style={styles.settingSubtitle}>
            Get daily notifications that inspire you to stay strong.
          </Text>
        </View>
        <Ionicons 
          name={notificationsEnabled ? "notifications" : "notifications-outline"} 
          size={24} 
          color="white" 
        />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    alignItems: 'center',
    padding: 20,
  },
  timer: {
    fontSize: 48,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  seconds: {
    fontSize: 24,
    color: '#FFFFFF',
    opacity: 0.7,
    marginBottom: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  actionButton: {
    alignItems: 'center',
    padding: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    marginTop: 8,
    fontSize: 14,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4FA65B',
  },
  progressText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'right',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 4,
  },
  settingSubtitle: {
    color: '#FFFFFF',
    opacity: 0.7,
    fontSize: 14,
  },
});

export default MainScreen; 