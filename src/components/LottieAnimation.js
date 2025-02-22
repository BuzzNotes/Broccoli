import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const LottieAnimation = () => {
  const animationRef = useRef(null);

  return (
    <View style={styles.container}>
      <LottieView
        ref={animationRef}
        source={require('../assets/animations/animation.json')}
        autoPlay
        loop
        style={styles.animation}
        resizeMode="cover"
        renderMode="HARDWARE"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default LottieAnimation; 