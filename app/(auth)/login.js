import React, { useState } from 'react';
import { View, Text, Pressable, SafeAreaView, Image, ActivityIndicator, Platform } from 'react-native';
import { router, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { authStyles } from './styles';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../src/context/AuthContext';

// Use require for static assets
const appleIcon = require('../../assets/icons/apple.png');
const googleIcon = require('../../assets/icons/google.png');
const emailIcon = require('../../assets/icons/email.png');

const LoginScreen = () => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleSkip = () => {
    router.push('/(onboarding)/good-news');
  };

  const handleSkipToTimer = async () => {
    // Set initial streak time
    const startTime = new Date().getTime();
    await AsyncStorage.setItem('streakStartTime', startTime.toString());
    // Go directly to timer
    router.replace('/(main)');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
    } catch (error) {
      setError('Failed to sign in with Google. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithApple();
    } catch (error) {
      setError('Failed to sign in with Apple. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = () => {
    router.push('/(auth)/signup');
  };

  const handleEmailSignIn = () => {
    router.push('/(auth)/signin');
  };

  return (
    <View style={authStyles.container}>
      {/* Main Background Gradient */}
      <LinearGradient
        colors={colors.gradients.primary.colors}
        style={authStyles.backgroundGradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Overlay Gradient */}
      <LinearGradient
        colors={[colors.gradients.overlay.end, colors.gradients.overlay.start]}
        style={authStyles.overlayGradient}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
      />

      {/* Background Vector */}
      <BackgroundVector />

      <SafeAreaView style={authStyles.contentContainer}>
        {/* Skip to Timer Button */}
        <Pressable 
          style={authStyles.skipToTimerButton} 
          onPress={handleSkipToTimer}
        >
          <Ionicons name="timer-outline" size={28} color="white" />
        </Pressable>

        {/* Logo Section */}
        <View style={authStyles.logoContainer}>
          <Text style={authStyles.logo}>QUIT WITH{'\n'}BROCCOLI</Text>
        </View>

        {/* Auth Buttons */}
        <View style={[authStyles.buttonsContainer, { marginTop: 'auto' }]}>
          {/* Google Login */}
          <Pressable 
            style={[authStyles.authButton, authStyles.googleButton]} 
            onPress={handleGoogleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" style={authStyles.buttonIcon} />
            ) : (
              <Ionicons name="logo-google" size={24} color="white" style={authStyles.buttonIcon} />
            )}
            <Text style={authStyles.buttonText}>
              Continue with Google
            </Text>
          </Pressable>

          {/* Apple Login */}
          {Platform.OS === 'ios' && (
            <Pressable 
              style={[authStyles.authButton, authStyles.appleButton]} 
              onPress={handleAppleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" style={authStyles.buttonIcon} />
              ) : (
                <Ionicons name="logo-apple" size={24} color="white" style={authStyles.buttonIcon} />
              )}
              <Text style={authStyles.buttonText}>Continue with Apple</Text>
            </Pressable>
          )}

          {/* Email Sign Up */}
          <Pressable 
            style={[authStyles.authButton, authStyles.emailButton]}
            onPress={handleEmailSignUp}
            disabled={loading}
          >
            <Ionicons 
              name="person-add-outline" 
              size={24} 
              color="white" 
              style={authStyles.buttonIcon} 
            />
            <Text style={authStyles.buttonText}>Sign Up with Email</Text>
          </Pressable>

          {/* Skip Button */}
          <View style={authStyles.skipContainer}>
            <Pressable 
              style={authStyles.skipButton} 
              onPress={handleSkip}
            >
              <Text style={authStyles.skipText}>Skip for Now</Text>
            </Pressable>
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
