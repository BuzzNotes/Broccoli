import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const LINES = [
  "Welcome to Broccoli,",
  "your path to freedom",
  "starts now"
];
const TYPING_SPEED = 50; // Milliseconds per character

const AutoTransitionScreen = () => {
  const [displayedText, setDisplayedText] = useState(['', '', '']);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const circleScale = useSharedValue(1);
  const circleOpacity = useSharedValue(1);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleOpacity.value,
  }));

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const navigateToMain = () => {
    // Use replace instead of push to prevent going back
    router.replace('/(standalone)/start-streak');
  };

  const animateCircle = () => {
    circleScale.value = withSequence(
      withSpring(1.2, { damping: 4, stiffness: 100 }),
      withSpring(1, { damping: 4, stiffness: 100 })
    );
  };

  useEffect(() => {
    let timeout;
    let isAnimating = true;

    const typeNextCharacter = () => {
      if (!isAnimating) return;

      if (currentLine < LINES.length) {
        const currentLineText = LINES[currentLine];
        
        if (currentChar < currentLineText.length) {
          // Update the displayed text for the current line
          setDisplayedText(prev => {
            const newText = [...prev];
            newText[currentLine] = currentLineText.slice(0, currentChar + 1);
            return newText;
          });
          
          // Trigger haptic feedback and circle animation
          runOnJS(triggerHaptic)();
          animateCircle();
          
          // Move to next character
          setCurrentChar(currentChar + 1);
          timeout = setTimeout(typeNextCharacter, TYPING_SPEED);
        } else {
          // Move to next line
          if (currentLine < LINES.length - 1) {
            setCurrentLine(currentLine + 1);
            setCurrentChar(0);
            timeout = setTimeout(typeNextCharacter, TYPING_SPEED * 3); // Longer pause between lines
          } else {
            // When typing is complete, start navigation sequence
            timeout = setTimeout(navigateToMain, 1000);
          }
        }
      }
    };

    timeout = setTimeout(typeNextCharacter, TYPING_SPEED);

    return () => {
      isAnimating = false;
      clearTimeout(timeout);
    };
  }, [currentLine, currentChar]);

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {displayedText.map((text, index) => (
          <Animated.Text
            key={index}
            style={[
              styles.text,
              {
                opacity: index === currentLine ? 1 : 
                         index < currentLine ? 0.8 : 0.3
              }
            ]}
          >
            {text}
          </Animated.Text>
        ))}
      </View>
      <Animated.View style={[styles.circle, animatedCircleStyle]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    height: 200, // Fixed height to prevent layout shifts
  },
  text: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginVertical: 8,
    width: width * 0.8,
    height: 48, // Fixed height to prevent layout shifts
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4FA65B',
    position: 'absolute',
    bottom: 50,
  },
});

export default AutoTransitionScreen; 