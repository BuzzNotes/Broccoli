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
  
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    changeDensity('sparse');
    
    // First breathing cycle
    const breatheIn = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1.5,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeInText, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]);

    const breatheOut = Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeInText, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeOutText, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]);

    const fadeAway = Animated.parallel([
      Animated.timing(fadeOutText, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIcon, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]);

    // Chain the animations
    const sequence = Animated.sequence([
      breatheIn,
      Animated.delay(1000),
      breatheOut,
      Animated.delay(1000),
      fadeAway,
      Animated.delay(500)
    ]);

    sequence.start(() => {
      if (!navigating) {
        setNavigating(true);
        router.push('/(intro)/welcome');
      }
    });
    
    return () => {
      sequence.stop();
      scaleAnim.setValue(1);
      fadeInText.setValue(0);
      fadeOutText.setValue(0);
      fadeIcon.setValue(1);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
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
          <Animated.Text style={[styles.text, { opacity: fadeInText }]}>
            Breathe in...
          </Animated.Text>
          
          <Animated.Text style={[styles.text, { opacity: fadeOutText }]}>
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