import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { standaloneStyles } from '../styles/standalone';

const { width } = Dimensions.get('window');

const StartStreakScreen = () => {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const handleStartStreak = async () => {
    try {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // Save start time to AsyncStorage
      const startTime = new Date().getTime();
      await AsyncStorage.setItem('streakStartTime', startTime.toString());
      
      // Navigate to main timer screen
      router.replace('/(main)');
    } catch (error) {
      console.error('Error starting streak:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={standaloneStyles.startStreak.safeArea}>
      <View style={globalStyles.container}>
        <LinearGradient
          colors={[colors.gradientStart, colors.gradientMiddle, colors.gradientEnd]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={globalStyles.center}>
          <Text style={standaloneStyles.startStreak.logo}>QUITTR</Text>
        </View>

        <View style={globalStyles.center}>
          <Text style={globalStyles.title}>Welcome to your{'\n'}Cannabis-Free Journey</Text>
          <Text style={globalStyles.subtitle}>#1 Science based marijuana quitting app</Text>
          
          <View style={styles.ratingContainer}>
            <View style={styles.laurelLeft}>
              <Ionicons name="leaf-outline" size={24} color="white" />
            </View>
            <View style={styles.stars}>
              {[...Array(5)].map((_, i) => (
                <Ionicons key={i} name="star" size={24} color="#FFD700" />
              ))}
            </View>
            <View style={styles.laurelRight}>
              <Ionicons name="leaf-outline" size={24} color="white" />
            </View>
          </View>
        </View>

        <Pressable
          style={[globalStyles.primaryButton, standaloneStyles.startStreak.button]}
          onPress={handleStartStreak}
        >
          <Ionicons name="timer-outline" size={24} color={colors.text.primary} style={styles.buttonIcon} />
          <Text style={globalStyles.buttonText}>Start Streak</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  laurelLeft: {
    transform: [{ scaleX: -1 }],
    marginRight: 10,
  },
  laurelRight: {
    marginLeft: 10,
  },
  stars: {
    flexDirection: 'row',
  },
  buttonIcon: {
    marginRight: 8,
  },
});

export default StartStreakScreen; 