import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import CustomButton from "../../../src/components/CustomButton";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ScreenBackground from "../../../src/components/ScreenBackground";
import QuizStyles from "../../../src/styles/QuizStyles";

export default function Question1Screen() {
  console.log("Rendering Question 1 screen"); // Debug log

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const handleAnswer = (answer) => {
    console.log('Selected:', answer);
    router.push('/(onboarding)/quiz/Question2');
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={QuizStyles.container}>
      <ScreenBackground />
      <View style={QuizStyles.content}>
        <Text style={QuizStyles.questionNumber}>Question 1 of 13</Text>
        <Text style={QuizStyles.title}>How long have you been using cannabis?</Text>

        <View style={QuizStyles.optionsContainer}>
          <CustomButton
            title="Less than 1 year"
            onPress={() => handleAnswer('< 1 year')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="1-3 years"
            onPress={() => handleAnswer('1-3 years')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="3-5 years"
            onPress={() => handleAnswer('3-5 years')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="More than 5 years"
            onPress={() => handleAnswer('> 5 years')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
        </View>
      </View>
    </View>
  );
} 