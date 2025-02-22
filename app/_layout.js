import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../src/config/firebase';

export default function Layout() {
  useEffect(() => {
    // Using auth here, so it's not "unused"
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('Auth State Changed:', user ? 'User Logged In' : 'No User');
    });

    return () => unsubscribe();  // Proper cleanup
  }, []);

  return (
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
          animation: Platform.OS === 'ios' ? 'default' : 'fade',
        }}
      >
        {/* Onboarding and Auth Screens */}
        <Stack.Screen name="index" options={{ animationEnabled: false }} />
        <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
        <Stack.Screen name="(onboarding)/good-news" options={{ animation: 'fade' }} />
        <Stack.Screen 
          name="(onboarding)/quiz/Question1"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/quiz/Question2"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/quiz/Question3"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/name-input"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/calculating"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/symptoms"
          options={{
            animation: 'fade',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/info/InfoScreen1"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/info/InfoScreen2"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/info/InfoScreen3"
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="(onboarding)/autoTransition"
          options={{
            animation: 'fade',
          }}
        />

        {/* Main App Screens */}
        <Stack.Screen 
          name="(main)"
          options={{
            animation: 'fade',
            gestureEnabled: false,
          }}
        />

        {/* Standalone Screens (outside tab navigation) */}
        <Stack.Screen 
          name="(standalone)/start-streak"
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
            presentation: 'fullScreenModal',
          }}
        />
        <Stack.Screen 
          name="(standalone)/relapse"
          options={{
            animation: 'slide_from_bottom',
            gestureEnabled: true,
            gestureDirection: 'vertical',
            presentation: 'fullScreenModal',
          }}
        />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A', // Fallback background
  },
}); 