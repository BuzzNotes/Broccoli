import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { typography } from '../../app/styles/typography';
import { LinearGradient } from 'expo-linear-gradient';

const SecondsRollDigit = ({ value, prevValue, isAnimating }) => {
  // Animation values for the rolling effect
  const rollAnimation = new Animated.Value(0);

  useEffect(() => {
    if (isAnimating) {
      // Reset animation value
      rollAnimation.setValue(0);
      
      // Run the rolling animation with a spring effect for more natural motion
      Animated.spring(rollAnimation, {
        toValue: 1,
        friction: 8, // Lower friction for more bounce
        tension: 40, // Lower tension for smoother motion
        useNativeDriver: true,
      }).start();
    }
  }, [value, isAnimating]);

  // Create interpolations for the rolling effect
  const currentPositionY = rollAnimation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 40, 60] // Accelerate then decelerate for more natural motion
  });

  const nextPositionY = rollAnimation.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [-60, -30, 0] // Start from above with variable speed
  });

  // Scale effect to create perspective
  const currentScale = rollAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.95, 0.9]
  });

  const nextScale = rollAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.9, 0.95, 1]
  });

  // Opacity for smooth transition
  const currentOpacity = rollAnimation.interpolate({
    inputRange: [0, 0.6, 1],
    outputRange: [1, 0.4, 0]
  });

  const nextOpacity = rollAnimation.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.8, 1]
  });

  return (
    <View style={styles.digitContainer}>
      {/* Current value that rolls down */}
      <Animated.View 
        style={[
          styles.digit,
          {
            transform: [
              { translateY: currentPositionY },
              { scale: currentScale }
            ],
            opacity: currentOpacity
          }
        ]}
      >
        <Text style={styles.digitText}>{prevValue}</Text>
      </Animated.View>
      
      {/* New value that rolls in from top */}
      <Animated.View 
        style={[
          styles.digit,
          {
            transform: [
              { translateY: nextPositionY },
              { scale: nextScale }
            ],
            opacity: nextOpacity
          }
        ]}
      >
        <Text style={styles.digitText}>{value}</Text>
      </Animated.View>
    </View>
  );
};

const SecondsFlipClock = ({ seconds }) => {
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (seconds !== prevSeconds) {
      setPrevSeconds(seconds);
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Slightly longer to accommodate spring animation
      
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  // Format the seconds value to always be two digits
  const formatValue = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  const formattedSeconds = formatValue(seconds);
  const prevFormattedSeconds = formatValue(prevSeconds);

  // Split the seconds into individual digits for better animation
  const currentDigits = formattedSeconds.split('');
  const prevDigits = prevFormattedSeconds.split('');

  return (
    <View style={styles.container}>
      <View style={styles.secondsContainer}>
        <LinearGradient
          colors={['rgba(20, 60, 37, 0.9)', 'rgba(26, 80, 50, 0.9)']}
          style={styles.secondsBackground}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.digitsRow}>
          <SecondsRollDigit 
            value={currentDigits[0]} 
            prevValue={prevDigits[0]} 
            isAnimating={isAnimating && prevDigits[0] !== currentDigits[0]} 
          />
          <SecondsRollDigit 
            value={currentDigits[1]} 
            prevValue={prevDigits[1]} 
            isAnimating={isAnimating && prevDigits[1] !== currentDigits[1]} 
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 255, 255)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondsContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(91, 189, 104, 0.4)',
  },
  secondsBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
  },
  digitsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
  },
  digitContainer: {
    width: 16,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  digit: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    opacity: 0.8,
  },
});

export default SecondsFlipClock; 