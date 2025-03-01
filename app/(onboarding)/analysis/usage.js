import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../app/styles/colors';
import { useLeafAnimation } from '../../../src/context/LeafAnimationContext';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const UsageAnalysis = () => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Set leaf density to normal for this screen
    changeDensity('normal');
    
    // Slide in from right when component mounts
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(onboarding)/questions/usage/amount');
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Slide out to right
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          colors.gradients.primary.start,
          colors.gradients.primary.start,
          'rgba(10, 10, 26, 0.4)',
          colors.background.dark
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.95 }}
        locations={[0, 0.5, 0.8, 1]}
      />

      <Animated.View style={[
        styles.mainContent,
        { 
          transform: [{ translateX: slideAnim }]
        }
      ]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>

        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Ionicons name="analytics" size={64} color="white" />
          </View>

          <Text style={styles.title}>Usage Pattern Analysis</Text>

          <Text style={styles.message}>
            Your cannabis usage patterns will help us understand your dependence level and create a personalized plan for reducing consumption.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  message: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gradients.primary.start,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default UsageAnalysis; 