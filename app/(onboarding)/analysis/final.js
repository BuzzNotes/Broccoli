import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, Dimensions, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../context/OnboardingContext';
import * as Haptics from 'expo-haptics';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans";
import LoadingScreen from '../../../src/components/LoadingScreen';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

const FinalAnalysis = () => {
  const { answers, saveAnswer } = useOnboarding();
  const [analysis, setAnalysis] = useState(null);
  const [dependencyScore, setDependencyScore] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showConfetti, setShowConfetti] = useState(true);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
  });

  useEffect(() => {
    calculateAnalysis();

    // Start pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Hide confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [answers]);

  const calculateAnalysis = () => {
    // Calculate dependency score (0-100)
    const scores = {
      frequency: answers.addiction_frequency?.score || 0,
      duration: answers.addiction_duration?.score || 0,
      increased: answers.addiction_increased?.score || 0,
      money: answers.addiction_money?.score || 0,
      anxiety: answers.addiction_anxiety?.score || 0,
      boredom: answers.addiction_boredom?.score || 0,
      stress: answers.addiction_stress?.score || 0,
      memory: answers.addiction_memory?.score || 0,
      other_substances: answers.addiction_other_substances?.score || 0,
      quit: answers.addiction_quit?.score || 0
    };

    // Calculate normalized scores for each factor (0-100)
    const normalizedScores = {
      frequency: Math.round((scores.frequency / 4) * 100), // frequency max is 4
      duration: Math.round((scores.duration / 4) * 100),   // duration max is 4
      tolerance: Math.round((scores.increased / 1) * 100), // increased max is 1
      emotional: Math.round(((scores.anxiety + scores.stress + scores.boredom) / 9) * 100)   // emotional max is 9 (3 each)
    };

    // Calculate total score from all answers
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const maxPossibleScore = 23; // Update this if max score changes
    const calculatedDependencyScore = Math.round((totalScore / maxPossibleScore) * 100);
    
    // Ensure dependency score is not 0 if there are any non-zero scores
    const finalDependencyScore = totalScore > 0 ? Math.max(calculatedDependencyScore, 1) : 0;
    setDependencyScore(finalDependencyScore);

    // Calculate annual cost and savings
    const weedCost = answers.weed_cost?.annual_cost || 0;
    const monthlySavings = Math.round(weedCost / 12);
    const weeklySavings = Math.round(weedCost / 52);
    const dailySavings = Math.round(weedCost / 365);

    // Ensure normalized scores are not 0 if there are any answers
    const finalNormalizedScores = {
      frequency: scores.frequency > 0 ? Math.max(normalizedScores.frequency, 1) : 0,
      duration: scores.duration > 0 ? Math.max(normalizedScores.duration, 1) : 0,
      tolerance: scores.increased > 0 ? Math.max(normalizedScores.tolerance, 1) : 0,
      emotional: (scores.anxiety + scores.stress + scores.boredom) > 0 ? 
        Math.max(normalizedScores.emotional, 1) : 0
    };

    setAnalysis({
      annualCost: weedCost,
      monthlySavings,
      weeklySavings,
      dailySavings,
      dependencyLevel: getDependencyLevel(finalDependencyScore),
      normalizedScores: finalNormalizedScores
    });
  };

  const getDependencyLevel = (score) => {
    if (score < 30) return 'Low';
    if (score < 60) return 'Moderate';
    if (score < 80) return 'High';
    return 'Very High';
  };

  const getScoreColor = (score) => {
    // Define color stops
    const colors = {
      0: '#4CAF50',   // Green
      30: '#8BC34A',  // Light Green
      50: '#FFC107',  // Amber
      70: '#FF9800',  // Orange
      85: '#FF5722',  // Deep Orange
      100: '#D32F2F', // Red
    };

    // Find the two closest color stops
    const stops = Object.keys(colors).map(Number).sort((a, b) => a - b);
    let lower = stops[0];
    let upper = stops[stops.length - 1];

    for (let i = 0; i < stops.length - 1; i++) {
      if (score >= stops[i] && score <= stops[i + 1]) {
        lower = stops[i];
        upper = stops[i + 1];
        break;
      }
    }

    // If score is at or beyond the limits, return the extreme colors
    if (score <= lower) return colors[lower];
    if (score >= upper) return colors[upper];

    // Calculate the percentage between the two stops
    const range = upper - lower;
    const progress = (score - lower) / range;

    // Convert hex to RGB for interpolation
    const lowerRGB = {
      r: parseInt(colors[lower].slice(1, 3), 16),
      g: parseInt(colors[lower].slice(3, 5), 16),
      b: parseInt(colors[lower].slice(5, 7), 16),
    };
    const upperRGB = {
      r: parseInt(colors[upper].slice(1, 3), 16),
      g: parseInt(colors[upper].slice(3, 5), 16),
      b: parseInt(colors[upper].slice(5, 7), 16),
    };

    // Interpolate between colors
    const resultRGB = {
      r: Math.round(lowerRGB.r + (upperRGB.r - lowerRGB.r) * progress),
      g: Math.round(lowerRGB.g + (upperRGB.g - lowerRGB.g) * progress),
      b: Math.round(lowerRGB.b + (upperRGB.b - lowerRGB.b) * progress),
    };

    // Convert back to hex
    const resultHex = '#' + 
      resultRGB.r.toString(16).padStart(2, '0') +
      resultRGB.g.toString(16).padStart(2, '0') +
      resultRGB.b.toString(16).padStart(2, '0');

    return resultHex;
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/rating');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!fontsLoaded || !analysis) return <LoadingScreen />;

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
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#4CAF50" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* Title Section */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Analysis Complete</Text>
            <Ionicons name="sparkles" size={28} color="#FFD700" style={styles.sparkleIcon} />
          </View>
          <Text style={styles.subtitle}>Here's what we're working with...</Text>
          
          {/* Money Section with Lead-in */}
          <Text style={styles.sectionLead}>Let's talk about your wallet</Text>
          <Text style={styles.analysisText}>You're spending a significant amount on cannabis:</Text>
          
          <View style={styles.section}>
            {showConfetti && (
              <ConfettiCannon
                count={200}
                origin={{x: -10, y: 0}}
                autoStart={true}
                fadeOut={true}
              />
            )}
            <Animated.View style={[
              styles.savingsCard,
              {
                transform: [{ scale: pulseAnim }]
              }
            ]}>
              <View style={styles.walletIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#666" />
              </View>
              <Text style={[styles.savingsAmount, { color: '#FF5252' }]}>${analysis.annualCost.toLocaleString()}</Text>
              <Text style={styles.savingsLabel}>Spent on Cannabis Yearly</Text>
              <View style={styles.savingsBreakdown}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownAmount}>${analysis.monthlySavings.toLocaleString()}</Text>
                  <Text style={styles.breakdownLabel}>Monthly Cost</Text>
                </View>
                <View style={styles.verticalSeparator} />
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownAmount}>${analysis.weeklySavings.toLocaleString()}</Text>
                  <Text style={styles.breakdownLabel}>Weekly Cost</Text>
                </View>
                <View style={styles.verticalSeparator} />
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownAmount}>${analysis.dailySavings.toLocaleString()}</Text>
                  <Text style={styles.breakdownLabel}>Daily Cost</Text>
                </View>
              </View>
            </Animated.View>
          </View>

          {/* Dependency Analysis Section with Lead-in */}
          <Text style={styles.sectionLead}>Your usage patterns</Text>
          <Text style={styles.analysisText}>Here's how your cannabis use compares to what we typically see:</Text>
          
          <View style={styles.section}>
            <View style={styles.dependencyCard}>
              <View style={styles.dependencyHeader}>
                <Text style={styles.dependencyLevel}>{analysis.dependencyLevel}</Text>
                <Text style={[styles.dependencyScore, { color: getScoreColor(dependencyScore) }]}>{dependencyScore}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[
                  styles.progressFill, 
                  { 
                    width: `${dependencyScore}%`,
                    backgroundColor: getScoreColor(dependencyScore)
                  }
                ]} />
              </View>
              <View style={styles.dependencyFactors}>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>Frequency of Use</Text>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorFill, { width: `${analysis.normalizedScores.frequency}%` }]} />
                  </View>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>Duration of Sessions</Text>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorFill, { width: `${analysis.normalizedScores.duration}%` }]} />
                  </View>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>Tolerance Level</Text>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorFill, { width: `${analysis.normalizedScores.tolerance}%` }]} />
                  </View>
                </View>
                <View style={styles.factorItem}>
                  <Text style={styles.factorLabel}>Emotional Impact</Text>
                  <View style={styles.factorBar}>
                    <View style={[styles.factorFill, { width: `${analysis.normalizedScores.emotional}%` }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Disclaimer Section */}
          <View style={styles.section}>
            <View style={styles.disclaimerCard}>
              <Ionicons name="information-circle-outline" size={24} color="#4CAF50" />
              <Text style={styles.disclaimerText}>
                This analysis is based on your responses and helps us personalize your journey. While informative, it's not a medical diagnosis.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Let's Make a Change</Text>
        </TouchableOpacity>
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
  content: {
    padding: 24,
    paddingTop: 80,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  section: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 24,
    color: '#333',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  savingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  savingsAmount: {
    fontSize: 42,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  savingsLabel: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
    marginBottom: 28,
  },
  savingsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingTop: 24,
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownAmount: {
    fontSize: 22,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  dependencyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  dependencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dependencyLevel: {
    fontSize: 28,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  dependencyScore: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
    marginBottom: 24,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  dependencyFactors: {
    gap: 16,
  },
  factorItem: {
    gap: 8,
  },
  factorLabel: {
    fontSize: 15,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: 6,
  },
  factorBar: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  factorFill: {
    height: '100%',
    backgroundColor: '#D32F2F',
    borderRadius: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    position: 'relative',
    width: '100%',
  },
  title: {
    fontSize: 32,
    color: '#232323',
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 0.25,
    marginBottom: 8,
  },
  sparkleIcon: {
    position: 'absolute',
    right: -12,
    top: 2,
    opacity: 0.9,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
    marginBottom: 48,
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 24,
  },
  sectionLead: {
    fontSize: 24,
    color: '#232323',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
    letterSpacing: 0.25,
  },
  analysisText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: 16,
    lineHeight: 22,
  },
  walletIconContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    opacity: 0.7,
  },
  verticalSeparator: {
    width: 1,
    height: '100%',
    backgroundColor: '#E0E0E0',
  },
});

export default FinalAnalysis; 