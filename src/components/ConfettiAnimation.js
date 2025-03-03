import React, { useRef, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const ConfettiAnimation = ({ animationKey, onAnimationFinish }) => {
  const animationRef = useRef(null);

  useEffect(() => {
    // Reset and play animation when key changes
    if (animationRef.current) {
      animationRef.current.reset();
      animationRef.current.play();
    }
  }, [animationKey]);

  return (
    <View style={styles.container} pointerEvents="none">
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/confetti.json')}
        autoPlay
        loop={false}
        style={styles.animation}
        resizeMode="cover"
        speed={0.8}
        onAnimationFinish={onAnimationFinish}
        key={animationKey}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default ConfettiAnimation; 