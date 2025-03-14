import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Dimensions, Animated, StatusBar } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  // Get the leaf animation context
  const { changeDensity, startAnimation, density: currentDensity } = useLeafAnimation();
  // Get route params to check if we're coming from breathe screen
  const params = useLocalSearchParams();
  const fromBreathe = params.fromBreathe === 'true';
  // Track if we're navigating away
  const [isNavigating, setIsNavigating] = useState(false);
  // Use a ref to track if we've already set the density
  const hasSetDensityRef = useRef(false);
  
  // Animation values for fade-in effects
  const fadeIconAnim = useRef(new Animated.Value(0)).current;
  const fadeTitleAnim = useRef(new Animated.Value(0)).current;
  const fadeSubtitleAnim = useRef(new Animated.Value(0)).current;
  const fadeButtonAnim = useRef(new Animated.Value(0)).current;
  // Animation value for the entire content
  const fadeContentAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Ensure animation is running
    startAnimation();
    
    // Only set the density once when the component mounts
    // This prevents multiple density changes during transitions
    if (!hasSetDensityRef.current) {
      // If coming from breathe screen, keep the sparse density
      // Otherwise use normal density
      const targetDensity = fromBreathe ? 'sparse' : 'normal';
      
      // Only change density if it's different from current
      if (currentDensity !== targetDensity) {
        console.log(`Welcome screen: Setting density to ${targetDensity}`);
        changeDensity(targetDensity);
      }
      
      hasSetDensityRef.current = true;
    }
    
    // Start fade-in animations with staggered timing for a smoother effect
    Animated.stagger(150, [
      // Fade in the icon
      Animated.timing(fadeIconAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in the title
      Animated.timing(fadeTitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in the subtitle
      Animated.timing(fadeSubtitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Fade in the button
      Animated.timing(fadeButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Cleanup function - don't change density on unmount
    return () => {};
  }, []);
  
  const handleStart = () => {
    // Prevent multiple navigation attempts
    if (isNavigating) return;
    
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Fade out all content
    Animated.timing(fadeContentAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      // Navigate to login screen after fade out completes
      router.push({
        pathname: '/(auth)/login',
        params: { animateIn: 'true' }
      });
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeContentAnim }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { opacity: fadeIconAnim }]}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="leaf" size={40} color="white" />
          </Animated.View>
          <Animated.Text style={[styles.title, { opacity: fadeTitleAnim }]}>
            Quit Tree Today
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: fadeSubtitleAnim }]}>
            Join thousands who have successfully quit cannabis with science-backed methods
          </Animated.Text>
        </View>

        <Animated.View style={[{ opacity: fadeButtonAnim, width: '100%' }, styles.buttonContainer]}>
          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleStart}
            disabled={isNavigating}
          >
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={16}
            />
            <Text style={styles.primaryButtonText}>Begin Assessment</Text>
            <View style={styles.buttonIcon}>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 40,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    margin: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 38,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 46,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '90%',
    textShadowColor: 'rgba(76, 175, 80, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: typography.fonts.semibold,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen; 