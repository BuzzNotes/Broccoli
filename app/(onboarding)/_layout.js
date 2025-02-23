import { Stack } from 'expo-router';
import { OnboardingProvider } from './context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Personal Information Section */}
        <Stack.Screen 
          name="questions/personal/age"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen 
          name="questions/personal/height"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen 
          name="questions/personal/weight"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen 
          name="questions/personal/activity"
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen 
          name="analysis/personal"
          options={{ animation: 'fade' }}
        />

        {/* Usage Patterns Section */}
        <Stack.Screen 
          name="questions/usage/frequency"
          options={{ animation: 'slide_from_right' }}
        />
        {/* Add more screens here as we create them */}
      </Stack>
    </OnboardingProvider>
  );
} 