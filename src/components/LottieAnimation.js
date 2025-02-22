import React, { useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const LottieAnimation = () => {
  const animationRef = useRef(null);

  return (
    <View style={styles.container}>
      <BlurView intensity={50} style={styles.blurContainer} />
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
    width: 200,
    height: 200,
    marginTop: 60,
    marginBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4FA65B',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  blurContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  animation: {
    width: '100%',
    height: '100%',
  },
});

export default LottieAnimation; 