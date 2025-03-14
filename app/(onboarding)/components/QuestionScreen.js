import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../../src/context/LeafAnimationContext';
import { typography } from '../../styles/typography';

const QuestionScreen = ({ 
  question, 
  options, 
  onAnswer, 
  currentStep, 
  totalSteps,
  nextRoute 
}) => {
  // Animation values for options and question
  const fadeAnims = useRef(options.map(() => new Animated.Value(0))).current;
  const scaleAnims = useRef(options.map(() => new Animated.Value(0.95))).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const questionFadeAnim = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Get the leaf animation context and set density to normal
  const { changeDensity } = useLeafAnimation();
  
  // Set initial progress value immediately to prevent layout jumps
  useEffect(() => {
    // Set initial progress value immediately
    progressAnim.setValue((currentStep - 1) / totalSteps);
  }, []);
  
  // Reset navigation state and run entrance animations when component mounts
  useEffect(() => {
    // Enable leaf animations with normal density
    changeDensity('normal');
    
    setIsNavigating(false);

    // Animate progress bar - with a slight delay to ensure layout is stable
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: currentStep / totalSteps,
        duration: 600,
        useNativeDriver: false,
      }).start();
    }, 50);

    // Animate question entrance
    Animated.timing(questionFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Animate options entrance with stagger
    options.forEach((_, index) => {
      fadeAnims[index].setValue(0);
      scaleAnims[index].setValue(0.95);
      
      Animated.sequence([
        Animated.delay(index * 100 + 200), // Add 200ms delay to let question fade in first
        Animated.parallel([
          Animated.spring(scaleAnims[index], {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnims[index], {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    });

    return () => {
      setIsNavigating(false);
    };
  }, [options, currentStep]);

  const handleOptionSelect = async (option, index) => {
    if (isNavigating) return;
    setIsNavigating(true);
    
    // Simple press animation
    Animated.sequence([
      Animated.spring(scaleAnims[index], {
        toValue: 0.95,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 200,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      // Handle answer and navigation
      if (onAnswer) {
        await onAnswer(option);
      }
      
      // Fade out question and options
      Animated.parallel([
        Animated.timing(questionFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...fadeAnims.map(anim =>
          Animated.timing(anim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          })
        )
      ]).start(() => {
        router.push(nextRoute);
      });
    } catch (error) {
      console.error('Navigation error:', error);
      setIsNavigating(false);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsNavigating(false);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      {/* Back Button */}
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#4CAF50" />
      </Pressable>

      {/* Progress Indicator - Now absolutely positioned */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentStep} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View style={styles.progressBackground} />
          <Animated.View style={[
            styles.progressFill,
            {
              transform: [{
                scaleX: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1]
                })
              }],
              transformOrigin: 'left'
            }
          ]}>
            <LinearGradient
              colors={['#4CAF50', '#388E3C']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Question */}
        <Animated.View style={[styles.questionContainer, { opacity: questionFadeAnim }]}>
          <Text style={styles.questionText}>{question}</Text>
        </Animated.View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {options.map((option, index) => (
            <Animated.View
              key={index}
              style={{
                opacity: fadeAnims[index],
                transform: [{ scale: scaleAnims[index] }],
              }}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.optionButton,
                  pressed && styles.optionButtonPressed,
                  isNavigating && styles.optionButtonDisabled
                ]}
                onPress={() => handleOptionSelect(option, index)}
                disabled={isNavigating}
              >
                <LinearGradient
                  colors={['#4CAF50', '#388E3C']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  borderRadius={16}
                />
                <Text style={styles.optionText}>{option}</Text>
                <View style={styles.optionIcon}>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
    shadowColor: 'rgba(0, 0, 0, 0.06)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    position: 'absolute',
    top: 120,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 2,
    height: 50,
  },
  progressText: {
    color: '#333333',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    opacity: 0.8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 4,
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '100%',
    borderRadius: 4,
  },
  questionContainer: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  questionText: {
    fontSize: 32,
    color: '#333333',
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    marginBottom: 40,
    lineHeight: 42,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  optionsContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
    zIndex: 2,
  },
  optionButton: {
    width: '100%',
    height: 70,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  optionButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  optionButtonDisabled: {
    opacity: 0.7,
  },
  optionText: {
    flex: 1,
    fontSize: 20,
    color: 'white',
    fontFamily: typography.fonts.bold,
    marginVertical: 12,
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  contentContainer: {
    flex: 1,
    paddingTop: 180,
    justifyContent: 'space-between',
  },
});

export default QuestionScreen; 