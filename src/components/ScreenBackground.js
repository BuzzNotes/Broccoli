import React, { memo } from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const ScreenBackground = memo(() => {
  return (
    <LinearGradient
      colors={['#0A0A1A', '#1A1A2E']}
      style={[StyleSheet.absoluteFill, { zIndex: -1 }]}
      useAngle={true}
      angle={45}
    />
  );
});

export default ScreenBackground; 