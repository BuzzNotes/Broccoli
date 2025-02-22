import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  withTiming, 
  useAnimatedStyle 
} from 'react-native-reanimated';
import CustomButton from "../../src/components/CustomButton";

const AnalysisCompleteScreen = () => {
  const userScore = 52; // Example user score
  const averageScore = 13; // Example average score
  const userScoreHeight = useSharedValue(0);
  const averageScoreHeight = useSharedValue(0);

  const userBarStyle = useAnimatedStyle(() => {
    return {
      height: `${userScoreHeight.value}%`,
      backgroundColor: 'red',
      minHeight: 30,
    };
  });

  const averageBarStyle = useAnimatedStyle(() => {
    return {
      height: `${averageScoreHeight.value}%`,
      backgroundColor: 'green',
      minHeight: 30,
    };
  });

  useEffect(() => {
    userScoreHeight.value = withTiming(userScore, {
      duration: 1000,
    });
    averageScoreHeight.value = withTiming(averageScore, {
      duration: 1000,
    });
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Analysis Complete ✅</Text>
      <Text style={styles.subtitle}>We've got some news to break to you...</Text>
      <Text style={styles.resultText}>
        Your responses indicate a clear dependence on cannabis.
      </Text>
      <View style={styles.barsContainer}>
        <Animated.View style={[styles.bar, userBarStyle]}>
          <Text style={styles.barLabel}>Your Score</Text>
        </Animated.View>
        <Animated.View style={[styles.bar, averageBarStyle]}>
          <Text style={styles.barLabel}>Average</Text>
        </Animated.View>
      </View>
      <Text style={styles.differenceText}>
        {userScore - averageScore}% higher dependence on cannabis
      </Text>
      <CustomButton
        title="Check your symptoms"
        onPress={() => router.push('/(onboarding)/symptoms')}
        backgroundColor="#4285F4"
        textColor="#FFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 24,
  },
  resultText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
    height: 200, // Fixed height for the bars
  },
  bar: {
    width: '40%', // Adjust width as needed
    backgroundColor: 'red',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barLabel: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  differenceText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
});

export default AnalysisCompleteScreen; 