import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import CustomButton from "../../../src/components/CustomButton";
import LoadingScreen from "../../../src/components/LoadingScreen";
import ScreenBackground from "../../../src/components/ScreenBackground";
import QuizStyles from "../../../src/styles/QuizStyles";

export default function Question3Screen() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const handleAnswer = (answer) => {
    console.log('Selected:', answer);
    router.push('/(onboarding)/name-input');
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={QuizStyles.container}>
      <ScreenBackground />
      <View style={QuizStyles.content}>
        <Text style={QuizStyles.questionNumber}>Question 3 of 13</Text>
        <Text style={QuizStyles.title}>What triggers your cravings?</Text>

        <View style={QuizStyles.optionsContainer}>
          <CustomButton
            title="Stress"
            onPress={() => handleAnswer('stress')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="Boredom"
            onPress={() => handleAnswer('boredom')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="Social Situations"
            onPress={() => handleAnswer('social')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
          <CustomButton
            title="Other"
            onPress={() => handleAnswer('other')}
            backgroundColor="#FFFFFF"
            textColor="#000000"
          />
        </View>
      </View>
    </View>
  );
} 