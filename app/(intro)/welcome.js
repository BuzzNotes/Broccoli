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
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Ionicons name="leaf" size={32} color="white" />
          </View>
          <Text style={styles.title}>Take Control{'\n'}of Your Life</Text>
          <Text style={styles.subtitle}>
            Join thousands who have successfully quit cannabis with science-backed methods
          </Text>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.startButton,
            pressed && styles.startButtonPressed
          ]}
          onPress={handleStart}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          <Text style={styles.buttonText}>Begin Assessment</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>
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
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 40,
    zIndex: 2,
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  title: {
    fontSize: 40,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 48,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 28,
    maxWidth: '90%',
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  startButtonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  leaf: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default WelcomeScreen; 