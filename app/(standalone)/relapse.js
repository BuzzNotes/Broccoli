import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
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
          <Text style={styles.cycleTitle}>Relapsing Cycle of Death</Text>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Jerking Off</Text>
            <Text style={styles.cycleItemText}>
              In the moment and during orgasm, you feel incredible.
            </Text>
          </View>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Post-Nut Clarity</Text>
            <Text style={styles.cycleItemText}>
              Shortly after finishing, the euphoria fades, leaving you with regret, sadness, and depression.
            </Text>
          </View>
          <View style={styles.cycleItem}>
            <Text style={styles.cycleItemTitle}>Compensation Cycle</Text>
            <Text style={styles.cycleItemText}>
              You masturbate again to alleviate the low feelings, perpetuating the cycle. If you don't stop, it becomes increasingly difficult to break free.
            </Text>
          </View>
        </View>

        <Pressable 
          style={[
            styles.resetButton,
            isResetting && styles.resetButtonDisabled
          ]}
          onPress={handleReset}
          disabled={isResetting}
        >
          <Text style={styles.buttonText}>Reset Counter</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  title: {
    fontSize: 36,
    color: '#FF4B4B',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  message: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  info: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 32,
    lineHeight: 24,
  },
  cycleContainer: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
  },
  cycleTitle: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  cycleItem: {
    marginBottom: 16,
  },
  cycleItemTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
  },
  cycleItemText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default RelapseScreen; 