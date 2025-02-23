import React from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView } from 'react-native';
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
  const handleOptionSelect = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onAnswer) {
      onAnswer(option);
    }
    router.push(nextRoute);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#4FA65B', '#45E994']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Back Button */}
      <Pressable onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="white" />
      </Pressable>

      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Question {currentStep} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${(currentStep / totalSteps) * 100}%` }
            ]} 
          />
        </View>
      </View>

      {/* Question */}
      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>{question}</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {options.map((option, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.optionButton,
              pressed && styles.optionButtonPressed
            ]}
            onPress={() => handleOptionSelect(option)}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
      </View>

      {/* Zen Element */}
      <View style={styles.zenElement}>
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: 'white',
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
  },
  optionsContainer: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  optionButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  optionButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  optionText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  zenElement: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    opacity: 0.5,
  },
});

export default QuestionScreen; 