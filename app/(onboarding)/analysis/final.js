import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, StatusBar, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context/OnboardingContext';
import { useLeafAnimation } from '../../../src/context/LeafAnimationContext';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { typography } from '../../styles/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CircularProgress = ({ percentage }) => {
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progressOffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={[{ width: size, height: size, position: 'relative' }, styles.progressShadow]}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#4CAF50" stopOpacity="1" />
            <Stop offset="1" stopColor="#388E3C" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(76, 175, 80, 0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={progressOffset}
          strokeLinecap="round"
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.percentageContainer}>
        <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
      </View>
    </View>
  );
};

const BarChart = ({ userScore, averageScore }) => {
  return (
    <View style={styles.chartContainer}>
      <View style={styles.barContainer}>
        <View style={styles.barWrapper}>
          <View style={[styles.bar, { height: 150 * (userScore / 100), backgroundColor: '#FF4B4B' }]} />
        </View>
        <Text style={styles.barLabel}>Your{'\n'}Score</Text>
        <Text style={styles.barValue}>{userScore}%</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barWrapper}>
          <View style={[styles.bar, { height: 150 * (averageScore / 100), backgroundColor: '#4CAF50' }]} />
        </View>
        <Text style={styles.barLabel}>Average</Text>
        <Text style={styles.barValue}>{averageScore}%</Text>
      </View>
    </View>
  );
};

const FinalAnalysis = () => {
  const insets = useSafeAreaInsets();
  const { answers } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastHapticProgress = useRef(0);
  
  // Get the leaf animation context and turn off leaves
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Turn off leaf animations for this page
    changeDensity('none');
    
    if (loading) {
      // Animate progress from 0 to 100 over 3 seconds
      const duration = 3000;
      const interval = 16; // ~60fps
      const steps = duration / interval;
      const increment = 100 / steps;
      let currentProgress = 0;

      const timer = setInterval(() => {
        currentProgress += increment;
        
        // Create a drumroll effect with haptic feedback
        const currentTwo = Math.floor(currentProgress / 2);
        const lastTwo = Math.floor(lastHapticProgress.current / 2);
        
        if (currentTwo > lastTwo) {
          // Increase intensity in the last 20%
          if (currentProgress > 80) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          } else if (currentProgress > 60) {
            // Alternate between light and medium for middle section
            Haptics.impactAsync(currentTwo % 2 === 0 ? 
              Haptics.ImpactFeedbackStyle.Light : 
              Haptics.ImpactFeedbackStyle.Medium);
          } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
        }
        lastHapticProgress.current = currentProgress;

        if (currentProgress >= 100) {
          clearInterval(timer);
          setLoading(false);
          // Final strong haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          // Fade in the analysis content
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();
        }
        setProgress(Math.min(currentProgress, 100));
      }, interval);

      return () => clearInterval(timer);
    }
  }, [loading]);

  const handleContinue = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      // Save assessment data for personalization
      const { saveUserAssessment } = require('../../../src/utils/assessmentTracker');
      await saveUserAssessment(answers);
      
      router.push('/(onboarding)/education');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // Calculate user's addiction score based on their answers
  const calculateAddictionScore = () => {
    // Get all addiction-related answers
    const addictionKeys = [
      'addiction_frequency',
      'addiction_duration',
      'addiction_increased',
      'addiction_anxiety',
      'addiction_memory',
      'addiction_other_substances',
      'addiction_gender', // This has a score of 0 for all options
      'addiction_stress',
      'addiction_boredom',
      'addiction_money'
    ];
    
    // Maximum possible score calculation
    // frequency (4) + duration (4) + increased (1) + anxiety (3) + memory (3) + 
    // other_substances (1) + gender (0) + stress (3) + boredom (3) + money (1) = 23
    const maxPossibleScore = 23;
    
    // Sum up the scores from all answers
    let totalScore = 0;
    let answeredQuestions = 0;
    
    addictionKeys.forEach(key => {
      if (answers[key] && typeof answers[key].score === 'number') {
        totalScore += answers[key].score;
        answeredQuestions++;
      }
    });
    
    // If user hasn't answered any questions, return a default score
    if (answeredQuestions === 0) {
      return 50; // Default score if no questions answered
    }
    
    // Calculate percentage of maximum possible score
    return Math.round((totalScore / maxPossibleScore) * 100);
  };

  // Calculate the user's score
  const userScore = calculateAddictionScore();
  
  // Average score for comparison (this would typically come from real data)
  const averageScore = 35;
  
  // Calculate the difference for display
  const difference = userScore - averageScore;

  // Get a dynamic result message based on the user's score
  const getResultMessage = (score) => {
    if (score >= 80) {
      return "Your responses indicate a severe dependence on cannabis*";
    } else if (score >= 60) {
      return "Your responses indicate a significant dependence on cannabis*";
    } else if (score >= 40) {
      return "Your responses indicate a moderate dependence on cannabis*";
    } else if (score >= 20) {
      return "Your responses indicate a mild dependence on cannabis*";
    } else {
      return "Your responses indicate a minimal dependence on cannabis*";
    }
  };

  // Get a dynamic comparison text based on the difference
  const getComparisonText = (diff) => {
    if (diff <= 0) {
      return `${Math.abs(diff)}% lower dependence than average`;
    } else {
      return `${diff}% higher dependence than average`;
    }
  };

  if (loading) {
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
        
        <View style={styles.loadingContainer}>
          <CircularProgress percentage={progress} />
          <Text style={styles.calculatingText}>Calculating</Text>
          <Text style={styles.understandingText}>Understanding responses...</Text>
        </View>
      </SafeAreaView>
    );
  }

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

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + 80 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Analysis Complete</Text>
            <Ionicons name="sparkles" size={28} color="#4CAF50" style={styles.twinkle} />
          </View>

          <Text style={styles.subtitle}>We've got some news to break to you...</Text>

          <View style={styles.resultCard}>
            <Text style={styles.resultText}>
              {getResultMessage(userScore)}
            </Text>
          </View>

          <View style={styles.chartCard}>
            <BarChart userScore={userScore} averageScore={averageScore} />

            <Text style={[
              styles.comparisonText, 
              { color: difference <= 0 ? '#4CAF50' : '#FF4B4B' }
            ]}>
              {getComparisonText(difference)}
            </Text>
          </View>

          <Text style={styles.disclaimer}>
            * This result is an indication only, not a medical diagnosis. For a definitive assessment, please contact your healthcare provider.
          </Text>
        </Animated.View>
      </ScrollView>
      
      {/* Fixed continue button at bottom */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom || 20 }]}>
        <Pressable 
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed
          ]}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={['#4CAF50', '#388E3C']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            borderRadius={16}
          />
          <Text style={styles.buttonText}>Learn about cannabis</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatingText: {
    fontSize: 32,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    marginTop: 32,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  understandingText: {
    fontSize: 20,
    color: '#666666',
    marginTop: 12,
    fontFamily: typography.fonts.medium,
    textShadowColor: 'rgba(76, 175, 80, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressShadow: {
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  percentageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentageText: {
    fontSize: 42,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  title: {
    fontSize: 36,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    letterSpacing: 0.5,
  },
  twinkle: {
    position: 'absolute',
    right: -36,
    top: -4,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 20,
    color: '#666666',
    marginBottom: 30,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.08)',
    alignItems: 'center',
  },
  resultText: {
    fontSize: 28,
    color: '#333333',
    textAlign: 'center',
    fontFamily: typography.fonts.bold,
    lineHeight: 38,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    paddingVertical: 36,
    width: '100%',
    marginBottom: 24,
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.08)',
    alignItems: 'center',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '100%',
    gap: 80,
    marginBottom: 30,
  },
  barContainer: {
    alignItems: 'center',
    width: 70,
  },
  barWrapper: {
    height: 150,
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  bar: {
    width: '100%',
    borderRadius: 12,
  },
  barLabel: {
    color: '#666666',
    fontSize: 16,
    marginBottom: 6,
    fontFamily: typography.fonts.medium,
    textAlign: 'center',
  },
  barValue: {
    color: '#333333',
    fontSize: 24,
    fontFamily: typography.fonts.bold,
  },
  comparisonText: {
    fontSize: 24,
    fontFamily: typography.fonts.bold,
    marginTop: 10,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 20,
    fontFamily: typography.fonts.regular,
    lineHeight: 20,
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'transparent',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    overflow: 'hidden',
    shadowColor: 'rgba(76, 175, 80, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
    width: '100%',
    justifyContent: 'center',
    height: 56,
  },
  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: typography.fonts.bold,
  },
});

export default FinalAnalysis; 