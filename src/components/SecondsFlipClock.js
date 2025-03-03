import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { typography } from '../../app/styles/typography';

const SecondsDropCard = ({ value, prevValue, isAnimating }) => {
  // Animation values for the dropping effect
  const currentValuePosition = new Animated.Value(0);
  const newValuePosition = new Animated.Value(-60); // Start above the container (negative value)
  const currentValueOpacity = new Animated.Value(1);
  const newValueOpacity = new Animated.Value(0);

  useEffect(() => {
    if (isAnimating) {
      // Reset animation values
      newValuePosition.setValue(-60);
      newValueOpacity.setValue(1);
      currentValueOpacity.setValue(1);
      
      // Run the dropping animation
      Animated.parallel([
        // Move current value down and fade out
        Animated.timing(currentValuePosition, {
          toValue: 60, // Move down out of view
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(currentValueOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        // Drop new value from top and fade in
        Animated.timing(newValuePosition, {
          toValue: 0, // Final position (centered)
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(newValueOpacity, {
          toValue: 1,
          duration: 300,
          delay: 100,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset positions when not animating
      currentValuePosition.setValue(0);
      newValuePosition.setValue(-60);
      currentValueOpacity.setValue(1);
      newValueOpacity.setValue(0);
    }
  }, [value, isAnimating]);

  return (
    <View style={styles.cardContainer}>
      {/* Current value that will move down */}
      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ translateY: currentValuePosition }],
            opacity: currentValueOpacity,
            zIndex: 1
          }
        ]}
      >
        <Text style={styles.cardText}>{prevValue}</Text>
      </Animated.View>
      
      {/* New value that drops from top */}
      <Animated.View 
        style={[
          styles.card,
          {
            transform: [{ translateY: newValuePosition }],
            opacity: newValueOpacity,
            zIndex: 2
          }
        ]}
      >
        <Text style={styles.cardText}>{value}</Text>
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
      }, 500); // Match animation duration
      
      return () => clearTimeout(timer);
    }
  }, [seconds]);

  // Format the seconds value to always be two digits
  const formatValue = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  const formattedSeconds = formatValue(seconds);
  const prevFormattedSeconds = formatValue(prevSeconds);

  return (
    <View style={styles.container}>
      <SecondsDropCard 
        value={formattedSeconds} 
        prevValue={prevFormattedSeconds} 
        isAnimating={isAnimating} 
      />
      <Text style={styles.secondsLabel}>seconds</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: 50,
    height: 60,
    position: 'relative',
    overflow: 'hidden', // Hide content that overflows
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardText: {
    fontSize: 30,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
  },
  secondsLabel: {
    fontSize: 12,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  }
});

export default SecondsFlipClock; 