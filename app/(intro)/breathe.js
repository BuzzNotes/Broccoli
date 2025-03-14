import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';
import { typography } from '../styles/typography';

const BreatheScreen = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeInText = useRef(new Animated.Value(0)).current;
  const fadeOutText = useRef(new Animated.Value(0)).current;
  const fadeIcon = useRef(new Animated.Value(1)).current;
  const [navigating, setNavigating] = useState(false);
  
  // Get the leaf animation context and set density to sparse
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Set leaf density to sparse for this screen
    changeDensity('sparse');
    
    // Full breathing animation sequence
    Animated.parallel([
      // Icon scale animation (grow then shrink)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.5,
          duration: 2000, // Grow for 2s
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 2000, // Shrink for 2s
          useNativeDriver: true,
        })
      ]),

      // Text transitions
      Animated.sequence([
        // First text
        Animated.timing(fadeInText, {
          toValue: 1,
          duration: 500, // Quick fade in
          useNativeDriver: true,
        }),
        Animated.timing(fadeInText, {
          toValue: 0,
          duration: 500, // Start fading out at 1.5s
          delay: 1000, // Wait for 1s
          useNativeDriver: true,
        }),
        // Second text
        Animated.timing(fadeOutText, {
          toValue: 1,
          duration: 500, // Quick fade in
          useNativeDriver: true,
        }),
        Animated.timing(fadeOutText, {
          toValue: 0,
          duration: 500, // Start fading out at 1.5s
          delay: 1000, // Wait for 1s
          useNativeDriver: true,
        }),
        // Icon fade out
        Animated.timing(fadeIcon, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      // When animation completes, navigate to welcome screen
      // Mark that we're navigating to prevent multiple navigations
      if (!navigating) {
        setNavigating(true);
        
        // IMPORTANT: Don't change the leaf density here
        // Let the welcome screen handle changing the density
        
        // Use replace instead of push to avoid back navigation
        router.replace({
          pathname: '/(intro)/welcome',
          // Pass a param to indicate we're coming from breathe screen
          params: { fromBreathe: true }
        });
      }
    });
    
    // Cleanup function
    return () => {
      // Don't change density on unmount - let the welcome screen handle it
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      <View style={styles.content}>
        <Animated.View
          style={[
            styles.breatheCircle,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeIcon,
            },
          ]}
        >
          <Ionicons name="leaf-outline" size={48} color="#4CAF50" />
        </Animated.View>

        <View style={styles.textContainer}>
          <Animated.Text style={[styles.text, { opacity: fadeInText, position: 'absolute' }]}>
            Breathe in...
          </Animated.Text>
          
          <Animated.Text style={[styles.text, { opacity: fadeOutText, position: 'absolute' }]}>
            Breathe out...
          </Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  breatheCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  text: {
    fontSize: 28,
    color: '#333333',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
    textShadowColor: 'rgba(76, 175, 80, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default BreatheScreen; 