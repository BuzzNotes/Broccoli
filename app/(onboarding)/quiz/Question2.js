import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import CustomButton from "../../../src/components/CustomButton";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ScreenBackground from "../../../src/components/ScreenBackground";
import QuizStyles from "../../../src/styles/QuizStyles";

export default function Question2Screen() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const handleAnswer = (answer) => {
    console.log('Selected:', answer);
    router.push('/(onboarding)/quiz/Question3');
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={QuizStyles.container}>
      <ScreenBackground />
      <View style={QuizStyles.content}>
        <Text style={QuizStyles.questionNumber}>Question 2 of 13</Text>
        <Text style={QuizStyles.title}>How often do you use cannabis?</Text>

        <View style={QuizStyles.optionsContainer}>
          <CustomButton
            title="Daily"
            onPress={() => handleAnswer('daily')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="Several times a week"
            onPress={() => handleAnswer('weekly')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="A few times a month"
            onPress={() => handleAnswer('monthly')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="Occasionally"
            onPress={() => handleAnswer('occasionally')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
        </View>
      </View>
    </View>
  );
} 