import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const symptoms = {
  mental: [
    'Memory problems',
    'Difficulty concentrating',
    'Brain fog',
    'Anxiety or paranoia',
    'Depression',
    'Mood swings',
    'Loss of motivation',
    'Racing thoughts'
  ],
  physical: [
    'Sleep problems',
    'Decreased appetite',
    'Fatigue',
    'Headaches',
    'Nausea',
    'Sweating',
    'Tremors or shaking',
    'Chest tightness'
  ],
  social: [
    'Avoiding social activities',
    'Relationship problems',
    'Work/study difficulties',
    'Financial issues',
    'Isolation from family',
    'Loss of hobbies',
    'Decreased social skills',
    'Dependency on smoking friends'
  ]
};

const SymptomsScreen = () => {
  const [selectedSymptoms, setSelectedSymptoms] = useState({
    mental: [],
    physical: [],
    social: []
  });

  const toggleSymptom = (category, symptomIndex) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSymptoms(prev => {
      const newSelection = [...prev[category]];
      const currentIndex = newSelection.indexOf(symptomIndex);
      
      if (currentIndex === -1) {
        newSelection.push(symptomIndex);
      } else {
        newSelection.splice(currentIndex, 1);
      }
      
      return {
        ...prev,
        [category]: newSelection
      };
    });
  };

  const getTotalSelected = () => {
    return Object.values(selectedSymptoms).reduce((sum, arr) => sum + arr.length, 0);
  };

  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push('/(onboarding)/education');
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const renderCategory = (title, category) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <View style={styles.symptomsGrid}>
        {symptoms[category].map((symptom, index) => (
          <Pressable
            key={index}
            style={({ pressed }) => [
              styles.symptomButton,
              selectedSymptoms[category].includes(index) && styles.selectedSymptom,
              pressed && styles.pressedSymptom
            ]}
            onPress={() => toggleSymptom(category, index)}
          >
            <Text style={[
              styles.symptomText,
              selectedSymptoms[category].includes(index) && styles.selectedSymptomText
            ]}>
              {symptom}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>What symptoms do you experience?</Text>
        <Text style={styles.subtitle}>Select all the symptoms you experience when using cannabis or during withdrawal.</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {renderCategory('Mental', 'mental')}
        {renderCategory('Physical', 'physical')}
        {renderCategory('Social', 'social')}
        <View style={styles.spacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            getTotalSelected() > 0 && styles.continueButtonEnabled,
            pressed && styles.continueButtonPressed
          ]}
          onPress={handleContinue}
          disabled={getTotalSelected() === 0}
        >
          <Text style={[
            styles.buttonText,
            getTotalSelected() > 0 && styles.buttonTextEnabled
          ]}>
            Continue
          </Text>
          {getTotalSelected() > 0 && (
            <View style={styles.selectedCount}>
              <Text style={styles.countText}>{getTotalSelected()}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 20,
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  categoryContainer: {
    padding: 20,
    paddingTop: 0,
  },
  categoryTitle: {
    fontSize: 24,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
  },
  symptomsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  symptomButton: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: '48%',
  },
  selectedSymptom: {
    backgroundColor: 'rgba(79, 166, 91, 0.3)',
    borderColor: '#4FA65B',
  },
  pressedSymptom: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  symptomText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  selectedSymptomText: {
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  spacer: {
    height: 100,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0A0A1A',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    opacity: 0.5,
  },
  continueButtonEnabled: {
    opacity: 1,
    backgroundColor: '#4FA65B',
  },
  continueButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  buttonTextEnabled: {
    color: 'white',
  },
  selectedCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 12,
  },
  countText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default SymptomsScreen; 