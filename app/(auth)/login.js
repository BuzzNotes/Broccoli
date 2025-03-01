import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, SafeAreaView, Image, ActivityIndicator, Platform } from 'react-native';
import { router, useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { authStyles } from './styles';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';
import { StatusBar } from 'expo-status-bar';
import { TouchableOpacity } from 'react-native';

// Use require for static assets
const appleIcon = require('../../assets/icons/apple.png');
const googleIcon = require('../../assets/icons/google.png');
const emailIcon = require('../../assets/icons/email.png');

const LoginScreen = () => {
  const { signInWithGoogle, signInWithApple, signInWithEmail, loading: authLoading } = useAuth();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
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
        setEmailLoading(false);
      }, 1500); // Keep loading visible for 1.5 seconds after auth completes
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticating]);

  if (!fontsLoaded) {
    return null;
  }

  const handleSkip = () => {
    router.push('/(tabs)');
  };

  const handleSkipToTimer = () => {
    router.push('/(tabs)/timer');
  };

  const handleGoogleSignIn = async () => {
    try {
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
    setError(null);
    router.push('/(auth)/email-login');
  };

  // Determine if any authentication method is in progress
  const isLoading = googleLoading || appleLoading || emailLoading || isAuthenticating;

  return (
    <View style={authStyles.container}>
      <StatusBar style="light" />
      
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#1A1A1A', '#2D2D2D']}
        style={authStyles.backgroundGradient}
      />

      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(79, 166, 91, 0.4)', 'rgba(79, 166, 91, 0)']}
        style={authStyles.overlayGradient}
      />

      {/* Background Vector */}
      <BackgroundVector />

      <SafeAreaView style={authStyles.contentContainer}>
        {/* Skip to Timer Button */}
        <TouchableOpacity 
          style={authStyles.skipToTimerButton} 
          onPress={handleSkipToTimer}
          disabled={isLoading}
        >
          <Ionicons name="timer-outline" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        {/* Logo Section */}
        <View style={authStyles.logoContainer}>
          <Text style={authStyles.logo}>Broccoli</Text>
          <Text style={authStyles.tagline}>Grow your focus, one session at a time</Text>
        </View>

        {/* Global loading indicator */}
        {isAuthenticating && (
          <View style={authStyles.globalLoadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={authStyles.loadingText}>
              Signing you in...
            </Text>
          </View>
        )}

        {/* Auth Buttons */}
        <View style={[authStyles.buttonsContainer, { marginTop: 'auto' }]}>
          {/* Google Login */}
          <TouchableOpacity
            style={[authStyles.authButton, authStyles.googleButton]}
            onPress={handleGoogleSignIn}
            disabled={isLoading}
          >
            <Image
              source={googleIcon}
              style={authStyles.buttonIcon}
            />
            <Text style={authStyles.buttonText}>
              {googleLoading ? 'Signing in with Google...' : 'Continue with Google'}
            </Text>
            {googleLoading && <ActivityIndicator color={colors.text.primary} style={{ marginLeft: 10 }} />}
          </TouchableOpacity>

          {/* Apple Login */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[authStyles.authButton, authStyles.appleButton]}
              onPress={handleAppleSignIn}
              disabled={isLoading}
            >
              <Image
                source={appleIcon}
                style={authStyles.buttonIcon}
              />
              <Text style={authStyles.buttonText}>
                {appleLoading ? 'Signing in with Apple...' : 'Continue with Apple'}
              </Text>
              {appleLoading && <ActivityIndicator color={colors.text.primary} style={{ marginLeft: 10 }} />}
            </TouchableOpacity>
          )}

          {/* Email Sign In */}
          <TouchableOpacity
            style={[authStyles.authButton, authStyles.emailButton]}
            onPress={handleEmailSignIn}
            disabled={isLoading}
          >
            <Ionicons name="mail-outline" size={24} color={colors.text.primary} style={authStyles.buttonIcon} />
            <Text style={authStyles.buttonText}>Continue with Email</Text>
          </TouchableOpacity>

          {/* Skip Button */}
          <View style={authStyles.skipContainer}>
            <TouchableOpacity
              style={authStyles.skipButton}
              onPress={handleSkip}
              disabled={isLoading}
            >
              <Text style={authStyles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </View>

        {error ? (
          <Text style={authStyles.errorText}>{error}</Text>
        ) : null}
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
