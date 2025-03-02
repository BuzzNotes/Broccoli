import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  StatusBar,
  Alert,
  SafeAreaView
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
      
      // Also reset any active timer session
      await AsyncStorage.removeItem('timerSessionStart');
      await AsyncStorage.removeItem('timerSessionPaused');
      await AsyncStorage.removeItem('timerSessionElapsed');
      
      // Show confirmation
      Alert.alert(
        "Counter Reset",
        "Your counter has been reset. Don't give up - every new start is a step forward.",
        [
          { 
            text: "OK", 
            onPress: () => {
              // Navigate to the main screen (timer) using the correct path
              router.replace('/(main)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error resetting counter:', error);
      Alert.alert("Error", "There was a problem resetting your counter. Please try again.");
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Enhanced green gradient background */}
      <LinearGradient
        colors={['#0F1A15', '#122A1E', '#0F1A15']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.logoText}>BROCCOLI</Text>
          <Text style={styles.headerTitle}>Reset Counter</Text>
        </View>
        
        {/* Empty view for layout balance */}
        <View style={styles.closeButton} />
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
          <LinearGradient
            colors={['rgba(79, 166, 91, 0.2)', 'rgba(61, 130, 71, 0.2)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1A15',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 166, 91, 0.2)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 20,
    color: '#4FA65B',
    fontFamily: typography.fonts.bold,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },
  title: {
    fontSize: 28,
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
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: colors.text.primary,
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.2)',
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
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
  },
  cancelButtonText: {
    color: '#4FA65B',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
});

export default RelapseScreen; 