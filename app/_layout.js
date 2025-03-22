import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, reinitializeFirebase } from '../src/config/firebase';
import { AuthProvider } from '../src/context/AuthContext';
import { LeafAnimationProvider } from '../src/context/LeafAnimationContext';
import { logFirebaseStatus, isFirebaseInitialized } from '../src/utils/firebaseCheck';
import LoadingScreen from '../src/components/LoadingScreen';
import PersistentLeafBackground from './components/PersistentLeafBackground';
import useCachedResources from '../src/hooks/useCachedResources';

export default function Layout() {
  const [firebaseReady, setFirebaseReady] = useState(true); // Start with true to avoid blocking navigation
  const [initAttempts, setInitAttempts] = useState(0);
  const isLoadingComplete = useCachedResources();
  
  useEffect(() => {
    // Check Firebase initialization status
    const checkFirebase = async () => {
      try {
        // Log Firebase status and get initialization result
        const isInitialized = logFirebaseStatus();
        
        if (!isInitialized && initAttempts < 2) {
          // Try to reinitialize Firebase if it's not initialized
          console.log(`Attempt ${initAttempts + 1} to initialize Firebase...`);
          const success = reinitializeFirebase();
          
          if (success) {
            console.log('Firebase reinitialization successful');
          } else {
            console.warn('Firebase reinitialization failed');
          }
          
          setInitAttempts(prev => prev + 1);
        }
        
        // Set up auth state listener
        if (auth) {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            console.log('Auth State Changed:', user ? 'User Logged In' : 'No User');
          });
          
          return () => unsubscribe();  // Proper cleanup
        }
      } catch (error) {
        console.error('Error in Firebase initialization check:', error);
        setFirebaseReady(true); // Continue anyway with limited functionality
      }
    };
    
    checkFirebase();
  }, [initAttempts]);

  if (!isLoadingComplete) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <LeafAnimationProvider>
        <View style={styles.container}>
          {/* Persistent background gradient */}
          <LinearGradient
            colors={['#0A0A1A', '#1A1A2E']}
            style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
          />
          
          {/* Persistent leaf background that stays across navigation */}
          <PersistentLeafBackground />
          
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: 'transparent' },
              animation: 'none',
              presentation: 'card',
              animationDuration: 0,
              gestureEnabled: false // Disable gesture navigation to prevent animation glitches
            }}
          >
            {/* Intro Group */}
            <Stack.Screen 
              name="(intro)"
              options={{ 
                animation: 'none',
                animationDuration: 0,
                gestureEnabled: false
              }} 
            />

            {/* Auth Screen */}
            <Stack.Screen 
              name="(auth)/login" 
              options={{ 
                animation: 'none',
                animationDuration: 0
              }} 
            />

            {/* Main App Screens */}
            <Stack.Screen 
              name="(main)"
              options={{
                animation: 'none',
                presentation: 'card'
              }}
            />

            {/* Onboarding Screens */}
            <Stack.Screen 
              name="(onboarding)"
              options={{
                animation: 'none',
                presentation: 'card'
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
            <Stack.Screen 
              name="(standalone)/panic"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="(standalone)/pledge"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="(standalone)/edit-profile"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="(standalone)/create-post"
              options={{
                animation: 'slide_from_bottom',
                presentation: 'modal'
              }}
            />
            <Stack.Screen 
              name="(standalone)/post-detail"
              options={{
                animation: 'slide_from_right',
                presentation: 'card'
              }}
            />
          </Stack>
        </View>
      </LeafAnimationProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
}); 