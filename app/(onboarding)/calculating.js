import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import LoadingScreen from "../../src/components/LoadingScreen";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const CIRCLE_LENGTH = 500; // Increased circumference for a larger circle
const R = CIRCLE_LENGTH / (2 * Math.PI); // Radius

export default function CalculatingScreen() {
  const progress = useSharedValue(0);
  const percentage = useSharedValue(0);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  const triggerHaptic = (progressValue) => {
    switch (progressValue) {
      case 10:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 30:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 50:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 75:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 100:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
    }
  };

  const navigateNext = () => {
    router.push('/(onboarding)/analysisComplete');
  };

  useEffect(() => {
    progress.value = withSequence(
      withTiming(1, { duration: 3000 }, (finished) => {
        if (finished) {
          runOnJS(navigateNext)();
        }
      })
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    const currentProgress = progress.value;
    percentage.value = Math.floor(currentProgress * 100);
    
    // Trigger haptics at specific percentages
    const currentPercentage = Math.floor(currentProgress * 100);
    if ([10, 30, 50, 75, 100].includes(currentPercentage)) {
      runOnJS(triggerHaptic)(currentPercentage);
    }

    return {
      strokeDashoffset: CIRCLE_LENGTH * (1 - currentProgress),
    };
  });

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.circleContainer}>
        <Svg style={styles.svg} width={R * 2} height={R * 2}>
          {/* Background Circle */}
          <Circle
            cx={R}
            cy={R}
            r={R - 25} // Adjusted for larger size
            stroke="#333"
            strokeWidth="10" // Increased stroke width
          />
          {/* Animated Progress Circle */}
          <AnimatedCircle
            cx={R}
            cy={R}
            r={R - 25} // Adjusted for larger size
            stroke="#4FA65B"
            strokeWidth="10" // Increased stroke width
            strokeDasharray={CIRCLE_LENGTH}
            animatedProps={animatedProps}
            strokeLinecap="round"
          />
        </Svg>
        <Animated.Text style={styles.percentageText}>
          {Math.floor(percentage.value)}%
        </Animated.Text>
      </View>
      <Text style={styles.title}>Calculating</Text>
      <Text style={styles.subtitle}>Learning relapse triggers</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    width: R * 2,
    height: R * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svg: {
    position: 'absolute',
    transform: [{ rotateZ: '-90deg' }],
  },
  percentageText: {
    fontSize: 64, // Increased font size for better visibility
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    position: 'absolute', // Centered within the circle
  },
  title: {
    marginTop: 40,
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
}); 