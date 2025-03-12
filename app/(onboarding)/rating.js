import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, Animated, Linking } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';

const RatingScreen = () => {
  const [selectedRating, setSelectedRating] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Get the leaf animation context
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Set leaf density to low for this screen
    changeDensity('low');
    
    // Animate the content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleRatingSelect = (rating) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRating(rating);
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // If user gave a high rating (4-5), prompt them to rate on the App Store
    if (selectedRating >= 4) {
      // In a real app, this would use the actual App Store URL
      Linking.openURL('https://apps.apple.com/app/id123456789');
    }
    
    // Continue to the referral screen
    router.push('/(onboarding)/referral');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/referral');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Enjoying Broccoli?</Text>
          <Text style={styles.subtitle}>
            Your feedback helps us improve the app and reach more people who need help quitting cannabis.
          </Text>
        </View>

        <View style={styles.ratingContainer}>
          {[1, 2, 3, 4, 5].map((rating) => (
            <Pressable
              key={rating}
              style={[
                styles.starButton,
                selectedRating >= rating && styles.selectedStar,
              ]}
              onPress={() => handleRatingSelect(rating)}
            >
              <Ionicons
                name={selectedRating >= rating ? "star" : "star-outline"}
                size={40}
                color={selectedRating >= rating ? "#FFD700" : "white"}
              />
            </Pressable>
          ))}
        </View>

        <Text style={styles.ratingText}>
          {selectedRating === 0 ? 'Tap to rate' :
           selectedRating === 1 ? 'Not good' :
           selectedRating === 2 ? 'Could be better' :
           selectedRating === 3 ? 'Good' :
           selectedRating === 4 ? 'Very good' : 'Excellent!'}
        </Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.submitButton,
              pressed && styles.buttonPressed,
              selectedRating === 0 && styles.buttonDisabled
            ]}
            onPress={handleSubmit}
            disabled={selectedRating === 0}
          >
            <LinearGradient
              colors={['#4FA65B', '#025A5C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.buttonText}>Submit</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.skipButton,
              pressed && styles.skipButtonPressed
            ]}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
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
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 8,
    marginHorizontal: 4,
  },
  selectedStar: {
    transform: [{ scale: 1.1 }],
  },
  ratingText: {
    fontSize: 20,
    color: 'white',
    marginBottom: 40,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default RatingScreen; 