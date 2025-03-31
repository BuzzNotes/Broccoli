import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width } = Dimensions.get('window');

const CelebrationAlert = ({ 
  visible, 
  title, 
  message, 
  onClose,
  duration = 3000 
}) => {
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);
  const animationInProgress = useRef(false);
  const timerRef = useRef(null);
  // Add state to control confetti explosion
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (visible && !animationInProgress.current) {
      // Set flag to prevent multiple animations
      animationInProgress.current = true;
      
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // Show confetti immediately before the alert animation starts
      setShowConfetti(true);
      
      // Slide in and fade in after a very short delay to let confetti start
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);

      // Auto close after duration
      timerRef.current = setTimeout(() => {
        // Slide out and fade out
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (onClose) onClose();
          // Reset animation flag after animation completes
          animationInProgress.current = false;
          setShowConfetti(false);
        });
      }, duration);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [visible, duration, onClose]);

  if (!visible && !showConfetti) return null;

  return (
    <>
      {showConfetti && (
        <ConfettiCannon
          count={150}
          origin={{ x: width / 2, y: 0 }}
          autoStart={true}
          fadeOut={true}
          explosionSpeed={350} // Faster explosion
        />
      )}
      <Animated.View 
        style={[
          styles.container,
          {
            transform: [{ translateY }],
            opacity,
          }
        ]}
      >
        <View style={styles.alertBox}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  alertBox: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default CelebrationAlert; 