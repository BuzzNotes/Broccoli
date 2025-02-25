import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const PanicScreen = () => {
  const insets = useSafeAreaInsets();
  
  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };
  
  const handleHelp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Open help resources
  };
  
  const handleRelapse = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(standalone)/relapse');
  };
  
  const handleThinking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show coping strategies
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <Pressable 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        
        <View style={styles.titleContainer}>
          <Text style={styles.logoText}>QUITTR</Text>
          <Text style={styles.headerTitle}>Panic Button</Text>
        </View>
        
        <Pressable 
          style={styles.helpButton} 
          onPress={handleHelp}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="help-circle" size={28} color="#FFFFFF" />
        </Pressable>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        <Text style={styles.mainMessage}>YOU DESERVE TO BE FREE FROM THIS</Text>
        
        <View style={styles.sideEffectsSection}>
          <Text style={styles.sectionTitle}>Side effects of Relapsing:</Text>
          
          <View style={styles.effectCard}>
            <View style={styles.effectIconContainer}>
              <Ionicons name="trending-down" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.effectTextContainer}>
              <Text style={styles.effectTitle}>ERECTILE DYSFUNCTION</Text>
              <Text style={styles.effectDescription}>Inability to get hard in bed.</Text>
            </View>
          </View>
          
          <View style={styles.effectCard}>
            <View style={styles.effectIconContainer}>
              <Ionicons name="eye-off" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.effectTextContainer}>
              <Text style={styles.effectTitle}>DESENSITIZATION</Text>
              <Text style={styles.effectDescription}>Needing more extreme content for arousal.</Text>
            </View>
          </View>
          
          <View style={styles.effectCard}>
            <View style={styles.effectIconContainer}>
              <Ionicons name="heart-dislike" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.effectTextContainer}>
              <Text style={styles.effectTitle}>RELATIONSHIP ISSUES</Text>
              <Text style={styles.effectDescription}>Decreased intimacy and trust.</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 20 }]}>
        <TouchableOpacity 
          style={styles.relapseButton} 
          activeOpacity={0.8}
          onPress={handleRelapse}
        >
          <LinearGradient
            colors={['#CC2D25', '#FF3B30']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="thumbs-down" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>I Relapsed</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.thinkingButton} 
          activeOpacity={0.8}
          onPress={handleThinking}
        >
          <LinearGradient
            colors={['#FF3B30', '#FF5E3A']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Ionicons name="warning" size={20} color="#FFFFFF" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>I'm thinking of relapsing</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
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
    color: '#FF3B30',
    fontFamily: typography.fonts.bold,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  mainMessage: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 60,
  },
  sideEffectsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: typography.fonts.medium,
    marginBottom: 20,
  },
  effectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
  },
  effectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  effectTextContainer: {
    flex: 1,
  },
  effectTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    marginBottom: 4,
  },
  effectDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: typography.fonts.regular,
  },
  actionButtons: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  relapseButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  thinkingButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: typography.fonts.bold,
  },
});

export default PanicScreen; 