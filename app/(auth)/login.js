import React, { useState, useEffect, useRef } from 'react';
import { View, Text, SafeAreaView, Image, ActivityIndicator, Platform, StyleSheet, Dimensions, Animated } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { colors } from '../styles/colors';
import { useAuth } from '../../src/context/AuthContext';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { typography } from '../styles/typography';

// Use require for static assets
const appleIcon = require('../../assets/icons/apple.png');
const googleIcon = require('../../assets/icons/google.png');
const broccoliLogo = require('../../assets/images/broccoli-logo.png');

const LoginScreen = () => {
  const { signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });
  
  // Get the leaf animation context but don't change density to prevent glitches
  const { density } = useLeafAnimation();
  
  // Get route params to check if we should animate in
  const params = useLocalSearchParams();
  const shouldAnimateIn = params.animateIn === 'true';
  
  // Animation values for fade-in effects
  const fadeLogoAnim = useRef(new Animated.Value(shouldAnimateIn ? 0 : 1)).current;
  const fadeButtonsAnim = useRef(new Animated.Value(shouldAnimateIn ? 0 : 1)).current;
  
  // Run fade-in animations when the component mounts
  useEffect(() => {
    if (shouldAnimateIn) {
      // Stagger the animations for a smoother effect
      Animated.stagger(200, [
        // Fade in the logo section
        Animated.timing(fadeLogoAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        // Fade in the buttons section
        Animated.timing(fadeButtonsAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [shouldAnimateIn]);
  
  // Monitor auth loading state to manage the global loading indicator
  useEffect(() => {
    if (authLoading) {
      // When auth is loading, ensure our local state shows loading too
      setIsAuthenticating(true);
    } else if (!authLoading && isAuthenticating) {
      // Add a small delay before removing the loading state
      // This ensures the loading indicator stays visible during navigation
      const timer = setTimeout(() => {
        setIsAuthenticating(false);
        setGoogleLoading(false);
        setAppleLoading(false);
      }, 1500); // Keep loading visible for 1.5 seconds after auth completes
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticating]);

  // Safety mechanism to reset loading state if stuck
  useEffect(() => {
    let timeout;
    
    if (isAuthenticating || googleLoading || appleLoading) {
      // Set a timeout to reset loading state after 35 seconds
      timeout = setTimeout(() => {
        if (googleLoading || appleLoading || isAuthenticating) {
          console.log('Authentication is taking too long - resetting state');
          setGoogleLoading(false);
          setAppleLoading(false);
          setIsAuthenticating(false);
          setError('Authentication timed out. Please try again.');
        }
      }, 35000);
    }
    
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [googleLoading, appleLoading, isAuthenticating]);

  if (!fontsLoaded) {
    return null;
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/good-news');
  };

  const handleGoToMain = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(main)');
  };

  const handleGoogleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setError(null);
      setGoogleLoading(true);
      setIsAuthenticating(true);
      await signInWithGoogle();
      // Don't reset loading state here - let the useEffect handle it
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      setError('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
      setIsAuthenticating(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setError(null);
      setAppleLoading(true);
      setIsAuthenticating(true);
      
      // Add timeout protection
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign-in timed out. Please try again.')), 30000)
      );
      
      // Race between the actual sign-in and the timeout
      await Promise.race([
        signInWithApple(),
        timeoutPromise
      ]);
      
      // Don't reset loading state here - let the useEffect handle it
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      let errorMessage = 'Apple sign-in failed. Please try again.';
      
      // More descriptive error messages based on the error
      if (error.message.includes('timed out')) {
        errorMessage = error.message;
      } else if (error.code === 'ERR_CANCELED') {
        errorMessage = 'Sign-in was cancelled.';
      }
      
      setError(errorMessage);
      setAppleLoading(false);
      setIsAuthenticating(false);
    }
  };

  const handleEmailSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setError(null);
    router.push('/(auth)/email-login');
  };

  // Determine if any authentication method is in progress
  const isLoading = googleLoading || appleLoading || isAuthenticating;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      <SafeAreaView style={styles.contentContainer}>
        {/* Main App Button */}
        <TouchableOpacity 
          style={styles.mainAppButton} 
          onPress={handleGoToMain}
          disabled={isLoading}
        >
          <Ionicons name="home-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>

        {/* Logo Section */}
        <Animated.View style={[styles.header, { opacity: fadeLogoAnim }]}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Image source={broccoliLogo} style={styles.logoImage} />
          </View>
          <Text style={styles.title}>Broccoli</Text>
          <Text style={styles.subtitle}>
            Grow your focus, one session at a time
          </Text>
        </Animated.View>

        {/* Global loading indicator */}
        {isAuthenticating && (
          <View style={styles.globalLoadingContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>
              Signing you in...
            </Text>
          </View>
        )}

        {/* Auth Buttons */}
        <Animated.View style={[styles.buttonsContainer, { opacity: fadeButtonsAnim }]}>
          {/* Google Login */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={16}
            />
            <Image
              source={googleIcon}
              style={[styles.buttonIcon, {tintColor: 'white'}]}
            />
            <Text style={styles.buttonText}>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
            {googleLoading && <ActivityIndicator color="white" style={{ marginLeft: 10 }} />}
          </TouchableOpacity>

          {/* Apple Login */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={styles.authButton}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                borderRadius={16}
              />
              <Image
                source={appleIcon}
                style={[styles.appleButtonIcon, { tintColor: 'white' }]}
              />
              <Text style={styles.buttonText}>
                {appleLoading ? 'Signing in with Apple...' : 'Continue with Apple'}
              </Text>
              {appleLoading && <ActivityIndicator color="white" style={{ marginLeft: 10 }} />}
            </TouchableOpacity>
          )}

          {/* Email Sign In */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleEmailSignIn}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={16}
            />
            <Ionicons name="mail-outline" size={24} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Skip Button */}
          <View style={styles.skipContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  logoImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
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
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 20,
    marginBottom: 40,
  },
  authButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  appleButtonIcon: {
    width: 28,
    height: 28,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: typography.fonts.semibold,
  },
  mainAppButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  globalLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
    marginTop: 16,
    fontFamily: typography.fonts.bold,
  },
  errorText: {
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: typography.fonts.semibold,
  },
});

export default LoginScreen;
