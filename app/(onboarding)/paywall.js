import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Image, Platform, Animated, Alert } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../src/config/firebase';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { awardOnboardingAchievement } from '../../src/utils/achievementUtils';

const SubscriptionOption = ({ isYearly, selected, onSelect }) => {
  const monthlyPrice = isYearly ? 3.33 : 12.99;
  const savings = isYearly ? '60%' : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.subscriptionOption,
        selected && styles.selectedOption,
        pressed && styles.optionPressed,
      ]}
      onPress={onSelect}
    >
      <View style={styles.priceContainer}>
        <Text style={styles.period}>{isYearly ? 'YEARLY' : 'MONTHLY'}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.currency}>$</Text>
          <Text style={styles.price}>{monthlyPrice.toFixed(2)}</Text>
          <Text style={styles.perMonth}>/mo</Text>
        </View>
      </View>
      {savings && (
        <View style={styles.savingsTag}>
          <Text style={styles.savingsText}>SAVE {savings}</Text>
        </View>
      )}
    </Pressable>
  );
};

const PaywallScreen = () => {
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const handleStartJourney = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Set onboarding completion flag in AsyncStorage
      await AsyncStorage.setItem('onboardingCompleted', 'true');
      
      // Initialize sober tracking
      const { setStreakStartTime } = require('../../src/utils/soberTracker');
      const startTime = new Date().getTime();
      await setStreakStartTime(startTime);
      
      // Update Firestore document if user is authenticated
      if (auth.currentUser) {
        const userDocRef = doc(db, 'users', auth.currentUser.uid);
        
        // First check if the user document exists
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // Update existing document
          await updateDoc(userDocRef, {
            onboarding_completed: false, // Not fully completed until community setup
            questions_completed: true,
            payment_completed: true,
            onboarding_state: 'community_setup',
            current_onboarding_step: 'community-setup',
            last_onboarding_completion: new Date().toISOString(),
            selected_plan: selectedPlan, // Save the selected plan
            streak_start_time: startTime,
            last_sync_time: startTime
          });
        } else {
          // Create new document with full onboarding state
          await setDoc(userDocRef, {
            onboarding_completed: false, // Not fully completed until community setup
            questions_completed: true,
            payment_completed: true,
            onboarding_state: 'community_setup',
            current_onboarding_step: 'community-setup',
            last_onboarding_completion: new Date().toISOString(),
            selected_plan: selectedPlan,
            streak_start_time: startTime,
            last_sync_time: startTime,
            email: auth.currentUser.email || '',
            displayName: auth.currentUser.displayName || '',
            photoURL: auth.currentUser.photoURL || ''
          });
        }
        
        // Award the onboarding achievement
        try {
          await awardOnboardingAchievement(auth.currentUser.uid);
        } catch (error) {
          console.error('Failed to award onboarding achievement:', error);
          // Non-critical error, continue with navigation
        }
      }
      
      // Navigate to community setup instead of main app
      router.replace('/(onboarding)/community-setup');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert(
        'Error',
        'There was a problem completing onboarding. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.background.dark, colors.background.dark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Get unlimited access to Broccoli including:</Text>
          <Text style={styles.features}>
            Personalized and Science-based Custom Plan, Community Chat, Streak Tracking, Guided Meditations, Recovery Progress + much more!
          </Text>
        </View>

        <View style={styles.subscriptionContainer}>
          <SubscriptionOption
            isYearly={true}
            selected={selectedPlan === 'yearly'}
            onSelect={() => setSelectedPlan('yearly')}
          />
          <SubscriptionOption
            isYearly={false}
            selected={selectedPlan === 'monthly'}
            onSelect={() => setSelectedPlan('monthly')}
          />
        </View>

        <Animated.View style={{ 
          transform: [{ scale: pulseAnim }],
          width: '100%',
        }}>
          <Pressable
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed
            ]}
            onPress={handleStartJourney}
          >
            <LinearGradient
              colors={['#4FA65B', '#45E994']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
            <Text style={styles.buttonText}>START MY JOURNEY</Text>
          </Pressable>
        </Animated.View>

        <Text style={styles.purchaseInfo}>
          Purchase appears as 'ITUNES STORE'
        </Text>

        <View style={styles.guaranteeContainer}>
          <Text style={styles.guaranteeText}>Cancel Anytime ✓</Text>
          <Text style={styles.guaranteeText}>Money back guarantee 🛡️</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    lineHeight: 36,
  },
  features: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  subscriptionContainer: {
    gap: 16,
    marginBottom: 32,
  },
  subscriptionOption: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: colors.gradients.primary.start,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  optionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  priceContainer: {
    alignItems: 'flex-start',
  },
  period: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  price: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginLeft: 2,
  },
  perMonth: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginLeft: 4,
  },
  savingsTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.gradients.primary.start,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    fontSize: 12,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  startButton: {
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  startButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    lineHeight: 56,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  purchaseInfo: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 8,
  },
  guaranteeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  guaranteeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
});

export default PaywallScreen; 