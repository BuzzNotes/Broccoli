import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  StatusBar,
  Dimensions,
  Pressable,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../styles/typography';
import { colors } from '../styles/colors';

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
    
    // First close the panic page by going back to the timer
    router.back();
    
    // Then open the relapse page after a short delay
    setTimeout(() => {
      router.push('/(standalone)/relapse');
    }, 100);
  };
  
  const handleThinking = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Show coping strategies
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
        <Pressable 
          style={styles.closeButton} 
          onPress={handleClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </Pressable>
        
        <View style={styles.titleContainer}>
          <Text style={styles.logoText}>BROCCOLI</Text>
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
      <View style={styles.container}>
        {/* Scrollable Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.mainMessage}>YOU DESERVE TO BE FREE FROM THIS</Text>
          
          <View style={styles.sideEffectsSection}>
            <Text style={styles.sectionTitle}>Side effects of Relapsing:</Text>
            
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
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="brain" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>COGNITIVE IMPAIRMENT</Text>
                <Text style={styles.effectDescription}>Reduced memory and concentration abilities.</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="medkit" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>RESPIRATORY ISSUES</Text>
                <Text style={styles.effectDescription}>Increased risk of bronchitis and lung infections.</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="sad" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>MENTAL HEALTH DECLINE</Text>
                <Text style={styles.effectDescription}>Higher rates of anxiety, depression, and paranoia.</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="wallet" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>FINANCIAL STRAIN</Text>
                <Text style={styles.effectDescription}>Wasting money that could be used for better things.</Text>
              </View>
            </View>
            
            <View style={styles.effectCard}>
              <View style={styles.effectIconContainer}>
                <Ionicons name="trending-down" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.effectTextContainer}>
                <Text style={styles.effectTitle}>ERECTILE DYSFUNCTION</Text>
                <Text style={styles.effectDescription}>Inability to get hard in bed.</Text>
              </View>
            </View>
          </View>
        </ScrollView>
        
        {/* Fixed Action Buttons */}
        <View style={[styles.actionButtons, { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }]}>
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
              colors={['#4FA65B', '#3D8247']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="warning" size={20} color="#FFFFFF" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>I'm thinking of relapsing</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1A15',
  },
  container: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
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
    color: '#4FA65B',
    fontFamily: typography.fonts.bold,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 200,
  },
  mainMessage: {
    fontSize: 32,
    color: '#FFFFFF',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 40,
  },
  sideEffectsSection: {
    marginTop: 10,
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
    marginBottom: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.2)',
  },
  effectIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(79, 166, 91, 0.2)',
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
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'rgba(15, 26, 21, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 166, 91, 0.2)',
    zIndex: 100,
  },
  relapseButton: {
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
  thinkingButton: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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