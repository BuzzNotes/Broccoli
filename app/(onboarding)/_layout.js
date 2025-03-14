import { Stack } from 'expo-router';
import { OnboardingProvider } from './context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'none'
      }}>
        {/* Good News Screen */}
        <Stack.Screen 
          name="good-news"
        />

        {/* Addiction Assessment Questions */}
        <Stack.Screen 
          name="questions/addiction/frequency"
        />
        <Stack.Screen 
          name="questions/addiction/duration"
        />
        <Stack.Screen 
          name="questions/addiction/increased"
        />
        <Stack.Screen 
          name="questions/addiction/anxiety"
        />
        <Stack.Screen 
          name="questions/addiction/memory"
        />
        <Stack.Screen 
          name="questions/addiction/other_substances"
        />
        <Stack.Screen 
          name="questions/addiction/gender"
        />
        <Stack.Screen 
          name="questions/addiction/stress"
        />
        <Stack.Screen 
          name="questions/addiction/boredom"
        />
        <Stack.Screen 
          name="questions/addiction/money"
        />

        {/* Analysis Screens */}
        <Stack.Screen 
          name="analysis/final"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="calculating"
          options={{ animation: 'fade' }}
        />
        <Stack.Screen 
          name="analysisComplete"
          options={{ animation: 'fade' }}
        />

        {/* Personal Information Section */}
        <Stack.Screen 
          name="questions/personal/age"
        />
        <Stack.Screen 
          name="questions/personal/height"
        />
        <Stack.Screen 
          name="questions/personal/weight"
        />
        <Stack.Screen 
          name="questions/personal/activity"
        />
        <Stack.Screen 
          name="analysis/personal"
          options={{ animation: 'fade' }}
        />

        {/* Usage Patterns Section */}
        <Stack.Screen 
          name="questions/usage/frequency"
        />
        <Stack.Screen 
          name="questions/usage/amount"
        />
        <Stack.Screen 
          name="questions/usage/method"
        />
        <Stack.Screen 
          name="analysis/usage"
          options={{ animation: 'fade' }}
        />

        {/* Other screens */}
        <Stack.Screen 
          name="symptoms"
        />
        <Stack.Screen 
          name="education"
        />
        <Stack.Screen 
          name="rating"
        />
        <Stack.Screen 
          name="referral"
        />
        <Stack.Screen 
          name="benefits"
        />
      </Stack>
    </OnboardingProvider>
  );
} 