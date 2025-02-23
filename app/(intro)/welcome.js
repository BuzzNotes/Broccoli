import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const WelcomeScreen = () => {
  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.primary.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        <Text style={styles.title}>Welcome!</Text>
        <Text style={styles.message}>
          Let's start out by finding out if you have a problem with Cannabis
        </Text>

        <Pressable 
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Start Quiz</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </View>

      {/* Zen Elements */}
      <View style={styles.zenElementLeft}>
        <Ionicons name="leaf-outline" size={24} color="rgba(255,255,255,0.3)" />
      </View>
      <View style={styles.zenElementRight}>
        <Ionicons name="leaf-outline" size={24} color="rgba(255,255,255,0.3)" />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    position: 'absolute',
    bottom: 40,
    right: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  zenElementLeft: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    opacity: 0.5,
    transform: [{ rotate: '-30deg' }],
  },
  zenElementRight: {
    position: 'absolute',
    top: 40,
    right: 40,
    opacity: 0.5,
    transform: [{ rotate: '30deg' }],
  },
});

export default WelcomeScreen; 