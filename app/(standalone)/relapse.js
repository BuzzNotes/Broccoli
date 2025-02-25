import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { logRelapse } from '../../src/utils/relapseTracker';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';

const RelapseScreen = () => {
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState('');
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleResetCounter = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      
      // Log the relapse with reason
      await logRelapse(reason);
      
      // Reset the streak counter
      const currentTime = new Date().getTime();
      await AsyncStorage.setItem('streakStartTime', currentTime.toString());
      
      // Navigate back to main screen
      router.replace('/(main)');
      
      // Show confirmation
      Alert.alert(
        "Counter Reset",
        "Your counter has been reset. Don't give up - every new start is a step forward.",
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error('Error resetting counter:', error);
      Alert.alert("Error", "There was a problem resetting your counter. Please try again.");
    }
  };
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Reset Counter</Text>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Are you sure?</Text>
        <Text style={styles.subtitle}>
          Resetting your counter will track this as a relapse in your progress.
        </Text>
        
        <View style={styles.reasonContainer}>
          <Text style={styles.reasonLabel}>What triggered your relapse? (optional)</Text>
          <TextInput
            style={styles.reasonInput}
            placeholder="e.g., stress, social pressure, boredom..."
            placeholderTextColor="rgba(255, 255, 255, 0.4)"
            value={reason}
            onChangeText={setReason}
            multiline
            maxLength={200}
          />
        </View>
        
        <TouchableOpacity 
          style={styles.resetButton}
          activeOpacity={0.8}
          onPress={handleResetCounter}
        >
          <LinearGradient
            colors={['#FF3B30', '#CC2D25']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.resetButtonText}>Reset Counter</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          activeOpacity={0.7}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F1A15',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 18,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontSize: 24,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: typography.fonts.regular,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  reasonContainer: {
    marginBottom: 32,
  },
  reasonLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.medium,
    marginBottom: 12,
  },
  reasonInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  resetButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
  cancelButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
});

export default RelapseScreen; 