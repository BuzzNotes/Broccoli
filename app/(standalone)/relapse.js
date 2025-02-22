import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';

const RelapseScreen = () => {
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    try {
      if (isResetting) return;
      setIsResetting(true);
      
      // Trigger haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Reset the streak start time
      const startTime = new Date().getTime();
      await AsyncStorage.setItem('streakStartTime', startTime.toString());
      
      // Navigate back to main screen
      router.replace('/(main)');
    } catch (error) {
      console.error('Error in reset handler:', error);
      setIsResetting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with Cancel Button */}
      <View style={styles.header}>
        <Pressable onPress={handleCancel} style={styles.cancelButton}>
          <Ionicons name="close" size={24} color={colors.text.secondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Relapsed</Text>
        <Text style={styles.message}>
          You let yourself down, again.
        </Text>
        <Text style={styles.info}>
          Relapsing can be tough and make you feel awful, but it's crucial not to be too hard on yourself. 
          Doing so can create a vicious cycle, as explained below.
        </Text>
        
        {/* Relapsing Cycle Section */}
        <View style={styles.cycleContainer}>
          <Text style={styles.cycleTitle}>The Relapse Cycle</Text>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Using Cannabis</Text>
            <Text style={styles.cycleItemText}>
              In the moment, you feel relaxed and temporarily escape your problems.
            </Text>
          </View>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Post-High Clarity</Text>
            <Text style={styles.cycleItemText}>
              As the high wears off, feelings of guilt, anxiety, and disappointment set in.
            </Text>
          </View>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Compensation Cycle</Text>
            <Text style={styles.cycleItemText}>
              You smoke again to numb these negative feelings, creating a cycle that becomes harder to break with each use.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Pressable 
          style={[styles.resetButton, isResetting && styles.resetButtonDisabled]}
          onPress={handleReset}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>Reset Counter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  cancelButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 36,
    color: '#FF4B4B',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 32,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    color: colors.text.secondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  cycleContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
  },
  cycleTitle: {
    fontSize: 24,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
  },
  cycleItem: {
    marginBottom: 20,
  },
  cycleItemTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
  },
  cycleItemText: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  resetButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  resetButtonText: {
    color: colors.text.primary,
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default RelapseScreen; 