import { Stack } from 'expo-router';
import { OnboardingProvider } from './context/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack 
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="benefits" />
        <Stack.Screen name="symptoms" />
        <Stack.Screen name="good-news" />
        <Stack.Screen name="analysisComplete" />
        <Stack.Screen name="autoTransition" />
        <Stack.Screen name="questions/addiction/index" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/concentration" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/craving" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/frequency" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/memory" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/fail" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/addiction/quit" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/personal/index" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/personal/sleep" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/personal/anxiety" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/personal/mood" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/patterns/index" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/patterns/reason" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/patterns/trigger" options={{ animation: 'none' }} />
        <Stack.Screen name="questions/patterns/social" options={{ animation: 'none' }} />
        <Stack.Screen name="analysis/index" options={{ animation: 'none' }} />
        <Stack.Screen name="analysis/final" options={{ animation: 'none' }} />
        <Stack.Screen name="education" options={{ animation: 'none' }} />
        <Stack.Screen name="paywall" options={{ animation: 'none' }} />
        <Stack.Screen name="community-setup" options={{ animation: 'none' }} />
      </Stack>
    </OnboardingProvider>
  );
} 