import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Dimensions, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';

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
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(79, 166, 91, 0.6)', 'rgba(79, 166, 91, 0)']}
        style={styles.overlayGradient}
      />

      <Animated.View style={[styles.content, { opacity: fadeContentAnim }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { opacity: fadeIconAnim }]}>
            <LinearGradient
              colors={['#5BCD6B', '#025A5C']}
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

        <Animated.View style={{ opacity: fadeButtonAnim, width: '100%' }}>
          <Pressable 
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed
            ]}
            onPress={handleStart}
            disabled={isNavigating}
          >
            <LinearGradient
              colors={['rgba(79, 166, 91, 0.8)', 'rgba(2, 90, 92, 0.5)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Begin Assessment</Text>
              <View style={styles.iconContainer2}>
                <Ionicons name="arrow-forward" size={18} color="white" />
              </View>
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
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '53%',
    opacity: 0.8,
    zIndex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: '#5BCD6B',
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
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 46,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '90%',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    shadowColor: 'rgba(79, 166, 91, 0.6)',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  iconContainer2: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
});

export default WelcomeScreen; 