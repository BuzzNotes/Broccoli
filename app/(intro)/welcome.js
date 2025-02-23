import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../styles/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const FloatingLeaf = ({ startDelay, duration, startY, size = 24, rotation = 0, startPosition }) => {
  const position = useRef(new Animated.Value(startPosition || -100)).current;
  const opacity = useRef(new Animated.Value(startPosition ? 0.4 : 0)).current;
  const rotate = useRef(new Animated.Value(rotation)).current;
  const [randomOffset] = useState(() => getRandomInRange(-30, 30));

  useEffect(() => {
    let isSubscribed = true;

    const animate = () => {
      if (!isSubscribed) return;

      // Reset values for new animation
      position.setValue(startPosition || -100);
      opacity.setValue(startPosition ? 0.4 : 0);
      rotate.setValue(rotation);
      
      const actualDuration = duration * getRandomInRange(0.8, 1.2);
      const remainingDuration = startPosition ? 
        (actualDuration * (1 - (startPosition / (width + 200)))) : 
        actualDuration;
      
      Animated.sequence([
        Animated.delay(startDelay),
        Animated.parallel([
          Animated.timing(position, {
            toValue: width + 100,
            duration: remainingDuration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: startPosition ? 0 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.4,
              duration: remainingDuration - (startPosition ? 1000 : 2000),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: rotation + 360,
            duration: remainingDuration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (isSubscribed) {
          animate();
        }
      });
    };

    animate();
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          transform: [
            { translateX: position },
            { translateY: randomOffset },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })}
          ],
          opacity,
          top: startY,
        },
      ]}
    >
      <Ionicons 
        name="leaf-outline" 
        size={size} 
        color="rgba(255, 255, 255, 0.4)" 
      />
    </Animated.View>
  );
};

const LeafBackground = React.memo(() => {
  const leafConfigs = React.useMemo(() => {
    const configs = [];
    for (let i = 0; i < 12; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: i * 200,
        duration: getRandomInRange(18000, 22000),
        size: getRandomInRange(20, 32),
        rotation: getRandomInRange(0, 360),
      });
    }
    for (let i = 0; i < 6; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: 0,
        duration: getRandomInRange(18000, 22000),
        size: getRandomInRange(20, 32),
        rotation: getRandomInRange(0, 360),
        startPosition: getRandomInRange(0, width)
      });
    }
    return configs;
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {leafConfigs.map((config, index) => (
        <FloatingLeaf
          key={index}
          startDelay={config.delay}
          duration={config.duration}
          startY={config.y}
          size={config.size}
          rotation={config.rotation}
          startPosition={config.startPosition}
        />
      ))}
    </View>
  );
});

const WelcomeScreen = () => {
  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={colors.gradients.primary.colors}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Floating Leaves Layer */}
      <LeafBackground />

      <View style={styles.content}>
        <View style={styles.welcomeContainer}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Ionicons name="leaf" size={48} color="white" />
          </View>
          <Text style={styles.title}>Welcome!</Text>
        </View>
        <Text style={styles.message}>
          Let's start out by finding out if you have a problem with Cannabis
        </Text>

        <Pressable 
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleStart}
        >
          <Text style={styles.buttonText}>Start Quiz</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>
      </View>

      {/* Static Zen Element - only keeping the bottom left one */}
      <View style={styles.zenElementLeft}>
        <Ionicons name="leaf-outline" size={24} color="rgba(255,255,255,0.3)" />
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
    padding: 20,
    zIndex: 2,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  title: {
    fontSize: 48,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  message: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 40,
    paddingHorizontal: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    position: 'absolute',
    bottom: 40,
    right: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  zenElementLeft: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    opacity: 0.5,
    transform: [{ rotate: '-30deg' }],
    zIndex: 2,
  },
  leaf: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default WelcomeScreen; 