import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../styles/colors';
import * as Haptics from 'expo-haptics';

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
  const progressAnim = useRef(new Animated.Value((currentStep - 1) / totalSteps)).current;
  const questionFadeAnim = useRef(new Animated.Value(0)).current;
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset navigation state and run entrance animations when component mounts
  useEffect(() => {
    setIsNavigating(false);

    // Animate progress bar
    Animated.timing(progressAnim, {
      toValue: currentStep / totalSteps,
      duration: 600,
      useNativeDriver: false,
    }).start();

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
      <LinearGradient
        colors={[colors.gradients.primary.start, colors.gradients.primary.end]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Back Button */}
      <Pressable onPress={handleBack} style={styles.backButton}>
        <LinearGradient
          colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Ionicons name="chevron-back" size={28} color="white" />
      </Pressable>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentStep} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={[styles.progressBackground]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
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
              colors={['#FFFFFF', 'rgba(255,255,255,0.8)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </Animated.View>
        </View>
      </View>

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
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={[StyleSheet.absoluteFill, styles.optionGradient]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.optionText}>{option}</Text>
              <View style={styles.optionIcon}>
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              </View>
            </Pressable>
          </Animated.View>
        ))}
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
    backgroundColor: colors.background.dark,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  progressContainer: {
    padding: 20,
    paddingTop: 120,
  },
  progressText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 32,
    color: 'white',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 40,
    lineHeight: 42,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  optionsContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  optionButtonPressed: {
    transform: [{ scale: 0.98 }],
  },
  optionButtonDisabled: {
    opacity: 0.7,
  },
  optionGradient: {
    borderRadius: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  optionIcon: {
    width: 24,
    alignItems: 'center',
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
    bottom: 40,
    right: 40,
    opacity: 0.5,
    transform: [{ rotate: '30deg' }],
  },
});

export default QuestionScreen; 