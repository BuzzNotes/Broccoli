import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Dimensions, Animated, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';
import { typography } from '../styles/typography';

const { width, height } = Dimensions.get('window');

const WelcomeScreen = () => {
  const { changeDensity, startAnimation } = useLeafAnimation();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const fadeIconAnim = useRef(new Animated.Value(0)).current;
  const fadeTitleAnim = useRef(new Animated.Value(0)).current;
  const fadeSubtitleAnim = useRef(new Animated.Value(0)).current;
  const fadeButtonAnim = useRef(new Animated.Value(0)).current;
  const fadeContentAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    startAnimation();
    changeDensity('normal');
    
    const animations = [
      Animated.timing(fadeIconAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeTitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeSubtitleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ];

    Animated.stagger(150, animations).start();
    
    return () => {
      animations.forEach(anim => anim.stop());
      fadeIconAnim.setValue(0);
      fadeTitleAnim.setValue(0);
      fadeSubtitleAnim.setValue(0);
      fadeButtonAnim.setValue(0);
      fadeContentAnim.setValue(1);
    };
  }, []);
  
  const handleStart = () => {
    if (isNavigating) return;
    
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.timing(fadeContentAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.push('/(auth)/login');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeContentAnim }]}>
        <View style={styles.header}>
          <Animated.View style={[styles.iconContainer, { opacity: fadeIconAnim }]}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Ionicons name="leaf" size={40} color="white" />
          </Animated.View>
          <Animated.Text style={[styles.title, { opacity: fadeTitleAnim }]}>
            Quit Tree Today
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: fadeSubtitleAnim }]}>
            Join thousands who have successfully quit cannabis with science-backed methods
          </Animated.Text>
        </View>

        <Animated.View style={[{ opacity: fadeButtonAnim, width: '100%' }, styles.buttonContainer]}>
          <Pressable 
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleStart}
            disabled={isNavigating}
          >
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              borderRadius={16}
            />
            <Text style={styles.primaryButtonText}>Begin Assessment</Text>
            <View style={styles.buttonIcon}>
              <Ionicons name="arrow-forward" size={18} color="white" />
            </View>
          </Pressable>
        </Animated.View>
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
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 40,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 80,
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    margin: 1,
    alignSelf: 'center',
  },
  title: {
    fontSize: 38,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 46,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '90%',
    textShadowColor: 'rgba(76, 175, 80, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  buttonContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontFamily: typography.fonts.semibold,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginLeft: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default WelcomeScreen; 