import { Stack } from 'expo-router';
import { OnboardingProvider } from './context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ 
        headerShown: false,
        animation: 'none'
      }}>
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
        <Stack.Screen 
          name="analysis/final"
          options={{ animation: 'fade' }}
        />
      </Stack>
    </OnboardingProvider>
  );
} 