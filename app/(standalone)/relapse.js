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
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />
      
      {/* Off-white background */}
      <View style={StyleSheet.absoluteFill}>
        <View style={{flex: 1, backgroundColor: '#F8F9FA'}} />
      </View>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#333333" />
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
            placeholderTextColor="rgba(0, 0, 0, 0.4)"
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
          <View style={styles.resetButtonInner}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.resetButtonText}>Reset Counter</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.cancelButton}
          activeOpacity={0.7}
          onPress={handleClose}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#F8F9FA',
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
    color: '#000000',
    fontFamily: typography.fonts.bold,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: 20,
    color: '#4CAF50',
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
    color: '#333333',
    fontFamily: typography.fonts.bold,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
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
    color: '#333333',
    fontFamily: typography.fonts.medium,
    marginBottom: 12,
  },
  reasonInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    color: '#333333',
    fontFamily: typography.fonts.regular,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  resetButton: {
    height: 56,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#FF3B30',
    shadowColor: 'rgba(255, 59, 48, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 3,
  },
  resetButtonInner: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    backgroundColor: '#FFFFFF',
    shadowColor: 'rgba(0, 0, 0, 0.05)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontFamily: typography.fonts.medium,
  },
});

export default RelapseScreen; 