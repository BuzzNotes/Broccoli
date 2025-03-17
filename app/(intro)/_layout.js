import { Stack } from 'expo-router';

export default function IntroLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'none',
        contentStyle: { backgroundColor: 'transparent' }
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="breathe" />
      <Stack.Screen name="welcome" />
    </Stack>
  );
} 