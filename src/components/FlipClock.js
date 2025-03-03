import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { typography } from '../../app/styles/typography';

const { width } = Dimensions.get('window');

const FlipCard = ({ value, prevValue, isFlipping }) => {
  const frontAnimatedValue = new Animated.Value(0);
  const backAnimatedValue = new Animated.Value(1);

  useEffect(() => {
    if (isFlipping) {
      Animated.parallel([
        Animated.timing(frontAnimatedValue, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(backAnimatedValue, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      frontAnimatedValue.setValue(0);
      backAnimatedValue.setValue(1);
    }
  }, [value, isFlipping]);

  const frontInterpolate = frontAnimatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-90deg', '-180deg']
  });

  const backInterpolate = backAnimatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['180deg', '90deg', '0deg']
  });

  const frontOpacity = frontAnimatedValue.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [1, 1, 0, 0]
  });

  const backOpacity = backAnimatedValue.interpolate({
    inputRange: [0, 0.5, 0.5001, 1],
    outputRange: [0, 0, 1, 1]
  });

  const frontTransform = [
    { rotateX: frontInterpolate }
  ];

  const backTransform = [
    { rotateX: backInterpolate }
  ];

  return (
    <View style={styles.cardContainer}>
      <Animated.View 
        style={[
          styles.card, 
          styles.cardFront, 
          { opacity: frontOpacity, transform: frontTransform }
        ]}
      >
        <Text style={styles.cardText}>{value}</Text>
      </Animated.View>
      <Animated.View 
        style={[
          styles.card, 
          styles.cardBack, 
          { opacity: backOpacity, transform: backTransform }
        ]}
      >
        <Text style={styles.cardText}>{prevValue}</Text>
      </Animated.View>
    </View>
  );
};

const FlipClock = ({ seconds, minutes, hours }) => {
  const [prevSeconds, setPrevSeconds] = useState(seconds);
  const [prevMinutes, setPrevMinutes] = useState(minutes);
  const [prevHours, setPrevHours] = useState(hours);
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    if (seconds !== prevSeconds || minutes !== prevMinutes || hours !== prevHours) {
      setPrevSeconds(seconds);
      setPrevMinutes(minutes);
      setPrevHours(hours);
      setIsFlipping(true);
      
      const timer = setTimeout(() => {
        setIsFlipping(false);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [seconds, minutes, hours]);

  // Format the time values to always be two digits
  const formatValue = (value) => {
    return value < 10 ? `0${value}` : `${value}`;
  };

  const formattedSeconds = formatValue(seconds);
  const formattedMinutes = formatValue(minutes);
  const formattedHours = formatValue(hours);
  const prevFormattedSeconds = formatValue(prevSeconds);
  const prevFormattedMinutes = formatValue(prevMinutes);
  const prevFormattedHours = formatValue(prevHours);

  return (
    <View style={styles.container}>
      <FlipCard 
        value={formattedHours} 
        prevValue={prevFormattedHours} 
        isFlipping={isFlipping && hours !== prevHours} 
      />
      <Text style={styles.separator}>:</Text>
      <FlipCard 
        value={formattedMinutes} 
        prevValue={prevFormattedMinutes} 
        isFlipping={isFlipping && minutes !== prevMinutes} 
      />
      <Text style={styles.separator}>:</Text>
      <FlipCard 
        value={formattedSeconds} 
        prevValue={prevFormattedSeconds} 
        isFlipping={isFlipping && seconds !== prevSeconds} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: 60,
    height: 80,
    position: 'relative',
    perspective: 1000,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(79, 166, 91, 0.3)',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardFront: {
    zIndex: 2,
  },
  cardBack: {
    transform: [{ rotateX: '180deg' }],
  },
  cardText: {
    fontSize: 40,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
  },
  separator: {
    fontSize: 40,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    marginHorizontal: 5,
  }
});

export default FlipClock; 