import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOnboarding } from '../context/OnboardingContext';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

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
            <Stop offset="0" stopColor="#4FA65B" stopOpacity="1" />
            <Stop offset="1" stopColor="#45E994" stopOpacity="1" />
          </SvgGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.1)"
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
  const barHeight = 200;
  const userBarHeight = (userScore / 100) * barHeight;
  const avgBarHeight = (averageScore / 100) * barHeight;

  return (
    <View style={styles.chartContainer}>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { height: userBarHeight, backgroundColor: '#FF4B4B' }]} />
        <Text style={styles.barLabel}>Your Score</Text>
        <Text style={styles.barValue}>{userScore}%</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={[styles.bar, { height: avgBarHeight, backgroundColor: '#4FA65B' }]} />
        <Text style={styles.barLabel}>Average</Text>
        <Text style={styles.barValue}>{averageScore}%</Text>
      </View>
    </View>
  );
};

const FinalAnalysis = () => {
  const { answers } = useOnboarding();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastHapticProgress = useRef(0);

  useEffect(() => {
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
      router.push('/(onboarding)/symptoms');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const userScore = 52;
  const averageScore = 13;
  const difference = userScore - averageScore;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0A0A1A', '#1A1A2E']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
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
      <LinearGradient
        colors={['#0A0A1A', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Analysis Complete</Text>
          <Ionicons name="sparkles" size={24} color="white" style={styles.twinkle} />
        </View>

        <Text style={styles.subtitle}>We've got some news to break to you...</Text>

        <Text style={styles.resultText}>
          Your responses indicate a clear{'\n'}dependence on cannabis*
        </Text>

        <BarChart userScore={userScore} averageScore={averageScore} />

        <Text style={styles.comparisonText}>
          {difference}% higher dependence on cannabis
        </Text>

        <Text style={styles.disclaimer}>
          * This result is an indication only, not a medical diagnosis. For a definitive assessment, please contact your healthcare provider.
        </Text>

        <Pressable 
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continueButtonPressed
          ]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Check your symptoms</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calculatingText: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 32,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  understandingText: {
    fontSize: 20,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
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
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 40,
    marginBottom: 8,
    position: 'relative',
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  twinkle: {
    position: 'absolute',
    right: -28,
    top: -4,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 40,
  },
  resultText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 32,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 240,
    width: '100%',
    gap: 40,
    marginBottom: 20,
  },
  barContainer: {
    alignItems: 'center',
    width: 60,
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
  },
  barLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 4,
  },
  barValue: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  comparisonText: {
    fontSize: 20,
    color: '#FF4B4B',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 40,
  },
  disclaimer: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default FinalAnalysis; 