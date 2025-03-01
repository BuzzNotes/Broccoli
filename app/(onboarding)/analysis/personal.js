import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, Dimensions, Platform } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../../app/styles/colors';
import { useLeafAnimation } from '../../../src/context/LeafAnimationContext';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const FloatingLeaf = ({ startDelay, duration, startY, size = 24, rotation = 0, startPosition }) => {
  const position = useRef(new Animated.Value(startPosition || -100)).current;
  const opacity = useRef(new Animated.Value(startPosition ? 0.3 : 0)).current;
  const rotate = useRef(new Animated.Value(rotation)).current;
  const [randomOffset] = useState(() => getRandomInRange(-20, 20));

  useEffect(() => {
    let isSubscribed = true;

    const animate = () => {
      if (!isSubscribed) return;

      position.setValue(startPosition || -100);
      opacity.setValue(startPosition ? 0.3 : 0);
      rotate.setValue(rotation);
      
      const actualDuration = duration * (startPosition ? 0.8 : 1);
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
              toValue: 0.3,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.3,
              duration: remainingDuration - 1600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 800,
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
        color="rgba(255, 255, 255, 0.3)" 
      />
    </Animated.View>
  );
};

const LeafBackground = React.memo(() => {
  const leafConfigs = React.useMemo(() => {
    const configs = [];
    for (let i = 0; i < 12; i++) {
      configs.push({
        y: getRandomInRange(0, height * 0.8),
        delay: i * 1000,
        duration: 20000 + getRandomInRange(-2000, 2000),
        size: getRandomInRange(20, 28),
        rotation: getRandomInRange(0, 360),
      });
    }
    
    for (let i = 0; i < 6; i++) {
      configs.push({
        y: getRandomInRange(0, height * 0.8),
        delay: 0,
        duration: 20000 + getRandomInRange(-2000, 2000),
        size: getRandomInRange(20, 28),
        rotation: getRandomInRange(0, 360),
        startPosition: getRandomInRange(0, width * 0.8)
      });
    }
    return configs;
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 0 }]}>
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

const PersonalAnalysis = () => {
  const slideAnim = useRef(new Animated.Value(width)).current;
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Set leaf density to normal for this screen
    changeDensity('normal');
    
    // Slide in from right when component mounts
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleContinue = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // Slide out to left
      Animated.timing(slideAnim, {
        toValue: -width,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        router.replace('/(onboarding)/questions/usage/frequency');
      });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Slide out to right
    Animated.timing(slideAnim, {
      toValue: width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[
          colors.gradients.primary.start,
          colors.gradients.primary.start,
          'rgba(10, 10, 26, 0.4)',
          colors.background.dark
        ]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.95 }}
        locations={[0, 0.5, 0.8, 1]}
      />

      <Animated.View style={[
        styles.mainContent,
        { 
          transform: [{ translateX: slideAnim }]
        }
      ]}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </Pressable>

        <View style={styles.centerContent}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <Ionicons name="analytics" size={64} color="white" />
          </View>

          <Text style={styles.title}>Physical Profile Analysis</Text>

          <Text style={styles.message}>
            Your body type and activity level will influence how quickly THC leaves your system. Active individuals tend to process THC faster due to higher metabolism and fat breakdown.
          </Text>
        </View>

        <View style={styles.footer}>
          <Pressable 
            style={({ pressed }) => [
              styles.continueButton,
              pressed && styles.continueButtonPressed
            ]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 24,
  },
  message: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 28,
    paddingHorizontal: 20,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gradients.primary.start,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
  },
  continueButtonPressed: {
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

export default PersonalAnalysis; 