import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const FloatingLeaf = ({ startDelay, duration, startY, size = 24, rotation = 0, startPosition, opacity: initialOpacity = 0.4 }) => {
  const position = useRef(new Animated.Value(startPosition || -100)).current;
  const opacity = useRef(new Animated.Value(startPosition ? initialOpacity : 0)).current;
  const rotate = useRef(new Animated.Value(rotation)).current;
  const [randomOffset] = useState(() => getRandomInRange(-30, 30));

  useEffect(() => {
    let isSubscribed = true;

    const animate = () => {
      if (!isSubscribed) return;

      // Reset values for new animation
      position.setValue(startPosition || -100);
      opacity.setValue(startPosition ? initialOpacity : 0);
      rotate.setValue(rotation);
      
      const actualDuration = duration * getRandomInRange(0.8, 1.2);
      const remainingDuration = startPosition ? 
        (actualDuration * (1 - (startPosition / (width + 200)))) : 
        actualDuration;
      
      Animated.sequence([
        Animated.delay(startDelay),
        Animated.parallel([
          Animated.timing(position, {
            toValue: width + 100,
            duration: remainingDuration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: initialOpacity,
              duration: startPosition ? 0 : 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: initialOpacity,
              duration: remainingDuration - (startPosition ? 1000 : 2000),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: rotation + 360,
            duration: remainingDuration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        if (isSubscribed) {
          animate();
        }
      });
    };

    animate();
    return () => {
      isSubscribed = false;
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.leaf,
        {
          transform: [
            { translateX: position },
            { translateY: randomOffset },
            { rotate: rotate.interpolate({
              inputRange: [0, 360],
              outputRange: ['0deg', '360deg']
            })}
          ],
          opacity,
          top: startY,
        },
      ]}
    >
      <Ionicons 
        name="leaf-outline" 
        size={size} 
        color="rgba(255, 255, 255, 0.4)" 
      />
    </Animated.View>
  );
};

const LeafBackground = React.memo(({ density = 'normal' }) => {
  // Adjust leaf count based on density
  const getLeafCount = () => {
    switch(density) {
      case 'sparse': return { main: 10, small: 3, large: 2, initial: 5 };
      case 'dense': return { main: 20, small: 8, large: 5, initial: 10 };
      case 'normal':
      default: return { main: 15, small: 5, large: 3, initial: 8 };
    }
  };

  const leafCounts = getLeafCount();
  
  const leafConfigs = React.useMemo(() => {
    const configs = [];
    // Main leaves
    for (let i = 0; i < leafCounts.main; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: i * 180,
        duration: getRandomInRange(18000, 22000),
        size: getRandomInRange(16, 40),
        rotation: getRandomInRange(0, 360),
        opacity: getRandomInRange(0.3, 0.5),
      });
    }
    
    // Very small leaves
    for (let i = 0; i < leafCounts.small; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: i * 300,
        duration: getRandomInRange(15000, 20000),
        size: getRandomInRange(10, 15),
        rotation: getRandomInRange(0, 360),
        opacity: getRandomInRange(0.2, 0.3),
      });
    }
    
    // Large leaves
    for (let i = 0; i < leafCounts.large; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: i * 500,
        duration: getRandomInRange(22000, 26000),
        size: getRandomInRange(42, 50),
        rotation: getRandomInRange(0, 360),
        opacity: getRandomInRange(0.2, 0.3),
      });
    }
    
    // Initial leaves already on screen
    for (let i = 0; i < leafCounts.initial; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: 0,
        duration: getRandomInRange(18000, 22000),
        size: getRandomInRange(16, 40),
        rotation: getRandomInRange(0, 360),
        startPosition: getRandomInRange(0, width),
        opacity: getRandomInRange(0.3, 0.5),
      });
    }
    return configs;
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {leafConfigs.map((config, index) => (
        <FloatingLeaf
          key={index}
          startDelay={config.delay}
          duration={config.duration}
          startY={config.y}
          size={config.size}
          rotation={config.rotation}
          startPosition={config.startPosition}
          opacity={config.opacity}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
    zIndex: 1,
  },
});

export default LeafBackground; 