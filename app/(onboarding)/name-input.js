import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from "../../src/components/CustomButton";
import LoadingScreen from "../../src/components/LoadingScreen";

export default function NameInputScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  // Load saved name and age if they exist
  useEffect(() => {
    loadSavedData();
  }, []);

  // Enable/disable button based on name and age
  useEffect(() => {
    setIsButtonEnabled(name.trim().length > 0 && age.trim().length > 0);
  }, [name, age]);

  const loadSavedData = async () => {
    try {
      const savedName = await AsyncStorage.getItem('userName');
      const savedAge = await AsyncStorage.getItem('userAge');
      if (savedName) setName(savedName);
      if (savedAge) setAge(savedAge);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleNext = async () => {
    try {
      await AsyncStorage.setItem('userName', name.trim());
      await AsyncStorage.setItem('userAge', age.trim());
      router.push('/(onboarding)/calculating');  // Navigate to calculating screen
    } catch (error) {
      console.error('Error saving data:', error);
    }
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Finally</Text>
        <Text style={styles.subtitle}>A little more about you</Text>

        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={styles.input}
          placeholder="Age"
          placeholderTextColor="#666"
          value={age}
          onChangeText={setAge}
          keyboardType="numeric"  // Only allow numeric input
        />

        <CustomButton
          title="Complete Quiz"
          onPress={handleNext}
          backgroundColor={isButtonEnabled ? "#4285F4" : "#A0A0A0"}
          textColor="#FFFFFF"
          disabled={!isButtonEnabled}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
    opacity: 0.8,
  },
  input: {
    width: '100%',
    height: 56,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 24,
    fontFamily: 'PlusJakartaSans-Bold',
  }
}); 