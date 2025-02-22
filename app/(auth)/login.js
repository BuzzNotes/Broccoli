import React from 'react';
import { View, Text, Pressable, SafeAreaView, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { authStyles } from './styles';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use require for static assets
const appleIcon = require('../../assets/icons/apple.png');
const googleIcon = require('../../assets/icons/google.png');
const emailIcon = require('../../assets/icons/email.png');

const LoginScreen = () => {
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
        {/* Logo Section */}
        <View style={authStyles.logoContainer}>
          <Text style={authStyles.logo}>QUIT WITH BROCCOLI</Text>
        </View>

        {/* Auth Buttons */}
        <View style={authStyles.buttonsContainer}>
          {/* Apple Login */}
          <Pressable style={[authStyles.authButton, authStyles.appleButton]}>
            <Image source={appleIcon} style={authStyles.buttonIcon} />
            <Text style={authStyles.buttonText}>Continue with Apple</Text>
          </Pressable>

          {/* Google Login */}
          <Pressable style={[authStyles.authButton, authStyles.googleButton]}>
            <Image source={googleIcon} style={authStyles.buttonIcon} />
            <Text style={authStyles.buttonText}>Continue with Google</Text>
          </Pressable>

          {/* Email Login */}
          <Pressable style={[authStyles.authButton, authStyles.emailButton]}>
            <Image source={emailIcon} style={authStyles.buttonIcon} />
            <Text style={authStyles.buttonText}>Continue with Email</Text>
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

        {/* Temporary Skip to Timer Button */}
        <Pressable 
          style={[authStyles.button, { backgroundColor: '#FF4B4B', marginTop: 20 }]} 
          onPress={handleSkipToTimer}
        >
          <Ionicons name="timer-outline" size={24} color="white" style={authStyles.buttonIcon} />
          <Text style={[authStyles.buttonText, { color: 'white' }]}>Skip to Timer (Dev)</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
