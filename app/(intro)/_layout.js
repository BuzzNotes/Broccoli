import { Stack } from 'expo-router';

export default function IntroLayout() {
  return (
    <Stack 
      screenOptions={{ 
        headerShown: false,
        animation: 'fade',
        contentStyle: { backgroundColor: 'transparent' },
        gestureEnabled: false
      }}
    >
      <Stack.Screen 
        name="index"
        options={{
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="breathe"
        options={{
          animation: 'fade'
        }}
      />
      <Stack.Screen 
        name="welcome"
        options={{
          animation: 'fade'
        }}
      />
    </Stack>
  );
} 