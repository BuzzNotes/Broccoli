import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../src/config/firebase';
import { AuthProvider } from '../src/context/AuthContext';

export default function Layout() {
  useEffect(() => {
    // Using auth here, so it's not "unused"
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth State Changed:', user ? 'User Logged In' : 'No User');
    });

    return () => unsubscribe();  // Proper cleanup
  }, []);

  return (
    <AuthProvider>
      <View style={styles.container}>
        {/* Persistent background gradient */}
        <LinearGradient
          colors={['#0A0A1A', '#1A1A2E']}
          style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
        />
        
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: 'transparent' },
            animation: 'none',
            presentation: 'card'
          }}
        >
          {/* Intro Screens */}
          <Stack.Screen 
            name="(intro)/breathe" 
            options={{ animation: 'fade' }} 
          />
          <Stack.Screen 
            name="(intro)/welcome" 
            options={{ animation: 'fade' }} 
          />

          {/* Auth Screen */}
          <Stack.Screen 
            name="(auth)/login" 
            options={{ animation: 'fade' }} 
          />

          {/* New Onboarding Screens */}
          <Stack.Screen 
            name="(onboarding)/good-news"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/personal/age"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/personal/height"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/personal/weight"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/personal/activity"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/analysis/personal"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/usage/frequency"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/analysis/usage"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/usage/amount"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/questions/usage/method"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen 
            name="(onboarding)/analysis/final"
            options={{ animation: 'fade' }}
          />

          {/* Main App Screens */}
          <Stack.Screen 
            name="(main)"
            options={{
              animation: 'none',
              presentation: 'card'
            }}
          />
          <Stack.Screen 
            name="(main)/index" 
            options={{ 
              animation: 'fade',
              presentation: 'card',
            }} 
          />
          <Stack.Screen 
            name="(main)/recovery" 
            options={{ 
              animation: 'slide_from_right',
              presentation: 'card',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />
          <Stack.Screen 
            name="(main)/profile" 
            options={{ 
              animation: 'slide_from_right',
              presentation: 'card',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
            }} 
          />

          {/* Standalone Screens */}
          <Stack.Screen 
            name="(standalone)/start-streak"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal'
            }}
          />
          <Stack.Screen 
            name="(standalone)/relapse"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal'
            }}
          />
          <Stack.Screen 
            name="(standalone)/meditate"
            options={{
              animation: 'slide_from_bottom',
              presentation: 'modal'
            }}
          />
        </Stack>
      </View>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A', // Fallback background
  },
}); 