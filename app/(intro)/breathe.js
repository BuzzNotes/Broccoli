import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import LeafBackground from '../components/LeafBackground';

const BreatheScreen = () => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeInText = useRef(new Animated.Value(0)).current;
  const fadeOutText = useRef(new Animated.Value(0)).current;
  const fadeIcon = useRef(new Animated.Value(1)).current;

  useEffect(() => {
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
          duration: 500, // Start fading in at 2s
          useNativeDriver: true,
        }),
        Animated.timing(fadeOutText, {
          toValue: 0,
          duration: 500, // Start fading out at 3.5s
          delay: 1000, // Wait for 1s
          useNativeDriver: true,
        })
      ]),

      // Icon fade out at the end
      Animated.timing(fadeIcon, {
        toValue: 0,
        duration: 500, // Quick fade out
        delay: 3500, // Start fading at 3.5s
        useNativeDriver: true,
      })
    ]).start(() => {
      router.push('/(intro)/welcome');
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Main Background Gradient */}
      <LinearGradient
        colors={['#0A0A0A', '#1A1A1A']}
        style={StyleSheet.absoluteFill}
      />

      {/* Overlay Gradient */}
      <LinearGradient
        colors={['rgba(79, 166, 91, 0.6)', 'rgba(79, 166, 91, 0)']}
        style={styles.overlayGradient}
      />

      {/* Floating Leaves Layer - sparse density for subtle effect */}
      <LeafBackground density="sparse" />

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
          <Ionicons name="leaf-outline" size={48} color="rgba(255,255,255,0.8)" />
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
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '53%',
    opacity: 0.8,
    zIndex: 1,
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#5BCD6B',
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
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
});

export default BreatheScreen; 