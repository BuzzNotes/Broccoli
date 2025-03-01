import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Image, ActivityIndicator, Platform, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { colors } from '../styles/colors';
import { useAuth } from '../../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';
import LeafBackground from '../components/LeafBackground';
import * as Haptics from 'expo-haptics';

// Use require for static assets
const appleIcon = require('../../assets/icons/apple.png');
const googleIcon = require('../../assets/icons/google.png');

const LoginScreen = () => {
  const { signInWithGoogle, signInWithApple, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState('');
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

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

  if (!fontsLoaded) {
    return null;
  }

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)');
  };

  const handleSkipToTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(tabs)/timer');
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
      await signInWithApple();
      // Don't reset loading state here - let the useEffect handle it
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      setError('Apple sign-in failed. Please try again.');
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
      <StatusBar style="light" />
      
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

      {/* Floating Leaves Layer */}
      <LeafBackground density="normal" />

      <SafeAreaView style={styles.contentContainer}>
        {/* Skip to Timer Button */}
        <TouchableOpacity 
          style={styles.skipToTimerButton} 
          onPress={handleSkipToTimer}
          disabled={isLoading}
        >
          <Ionicons name="timer-outline" size={24} color="white" />
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['#5BCD6B', '#025A5C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="leaf" size={40} color="white" />
          </View>
          <Text style={styles.title}>Broccoli</Text>
          <Text style={styles.subtitle}>
            Grow your focus, one session at a time
          </Text>
        </View>

        {/* Global loading indicator */}
        {isAuthenticating && (
          <View style={styles.globalLoadingContainer}>
            <ActivityIndicator size="large" color="#5BCD6B" />
            <Text style={styles.loadingText}>
              Signing you in...
            </Text>
          </View>
        )}

        {/* Auth Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Google Login */}
          <TouchableOpacity
            style={styles.authButton}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={googleIcon}
              style={styles.buttonIcon}
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
              <Image
                source={appleIcon}
                style={styles.buttonIcon}
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
        </View>

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
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '53%',
    opacity: 0.8,
    zIndex: 1,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 2, // Higher than overlay gradient
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
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 20,
    marginBottom: 40,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
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
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skipToTimerButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  globalLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default LoginScreen;
