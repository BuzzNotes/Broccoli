import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import CustomButton from "../../src/components/CustomButton";
import LoadingScreen from "../../src/components/LoadingScreen";

const symptomsList = [
  { id: '1', label: 'Feeling unmotivated', category: 'Mental' },
  { id: '2', label: 'Lack of ambition to pursue goals', category: 'Mental' },
  { id: '3', label: 'Difficulty concentrating', category: 'Mental' },
  { id: '4', label: 'Poor memory or "brain fog"', category: 'Mental' },
  // Add more symptoms as needed
];

export default function SymptomsScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const toggleSymptom = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((symptom) => symptom !== id) : [...prev, id]
    );
  };

  const handleContinue = () => {
    // Save selected symptoms to AsyncStorage or state management
    console.log('Selected Symptoms:', selectedSymptoms);
    router.push('/(onboarding)/info/InfoScreen1'); // Update to the next screen
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Symptoms</Text>
      <View style={styles.warningBox}>
        <Text style={styles.warningText}>
          Excessive porn use can have negative impacts psychologically.
        </Text>
      </View>
      <Text style={styles.subtitle}>Select any symptoms below:</Text>
      <ScrollView>
        {symptomsList.map((symptom) => (
          <View key={symptom.id} style={styles.optionContainer}>
            <CustomButton
              title={symptom.label}
              onPress={() => toggleSymptom(symptom.id)}
              backgroundColor={selectedSymptoms.includes(symptom.id) ? "#4FA65B" : "#FFFFFF"}
              textColor={selectedSymptoms.includes(symptom.id) ? "#FFFFFF" : "#000000"}
            />
          </View>
        ))}
      </ScrollView>
      <CustomButton
        title="Continue"
        onPress={handleContinue}
        backgroundColor={selectedSymptoms.length > 0 ? "#4285F4" : "#A0A0A0"}
        textColor="#FFFFFF"
        disabled={selectedSymptoms.length === 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    padding: 24,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  warningBox: {
    backgroundColor: '#FF4B4B',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  optionContainer: {
    marginBottom: 10,
  },
}); 