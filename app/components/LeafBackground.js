import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const FloatingLeaf = ({ startDelay, duration, startY, size = 24, rotation = 0, startPosition, opacity: initialOpacity = 0.25 }) => {
  const position = useRef(new Animated.Value(startPosition || -100)).current;
  const opacity = useRef(new Animated.Value(startPosition ? initialOpacity : 0)).current;
  const rotate = useRef(new Animated.Value(rotation)).current;
  const [randomOffset] = useState(() => getRandomInRange(-30, 30));
  
  // Track animation state to prevent unnecessary resets
  const animationStateRef = useRef({
    isAnimating: false,
    animationStartTime: 0,
    animationId: Math.random().toString(36).substring(7),
    currentPosition: startPosition || -100,
    currentOpacity: startPosition ? initialOpacity : 0,
    currentRotation: rotation,
    animationInstance: null
  });

  useEffect(() => {
    let isSubscribed = true;
    const currentTime = Date.now();
    
    // Only start a new animation if one isn't already running
    // or if it's been a while since the last animation started
    const shouldStartNewAnimation = 
      !animationStateRef.current.isAnimating || 
      (currentTime - animationStateRef.current.animationStartTime > 5000);

    const animate = () => {
      if (!isSubscribed) return;
      
      // If we shouldn't start a new animation, return early
      if (!shouldStartNewAnimation && animationStateRef.current.animationInstance) return;
      
      // Mark animation as started
      animationStateRef.current = {
        ...animationStateRef.current,
        isAnimating: true,
        animationStartTime: currentTime
      };

      // Reset values for new animation only if we're starting fresh
      // Don't reset if we're in the middle of an animation (during transitions)
      if (shouldStartNewAnimation) {
        // Store current values in the ref to maintain state across renders
        animationStateRef.current.currentPosition = startPosition || -100;
        animationStateRef.current.currentOpacity = startPosition ? initialOpacity : 0;
        animationStateRef.current.currentRotation = rotation;
        
        // Set the actual animated values
        position.setValue(animationStateRef.current.currentPosition);
        opacity.setValue(animationStateRef.current.currentOpacity);
        rotate.setValue(animationStateRef.current.currentRotation);
      }
      
      const actualDuration = duration * getRandomInRange(0.8, 1.2);
      const remainingDuration = startPosition ? 
        (actualDuration * (1 - (startPosition / (width + 200)))) : 
        actualDuration;
      
      // Create a unique animation ID for this animation cycle
      const animationId = animationStateRef.current.animationId;
      
      // Create and store the animation sequence
      const animationSequence = Animated.sequence([
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
            toValue: rotation + getRandomInRange(-30, 30),
            duration: remainingDuration,
            useNativeDriver: true,
          }),
        ]),
      ]);
      
      // Store the animation instance in the ref
      animationStateRef.current.animationInstance = animationSequence;
      
      // Start the animation
      animationSequence.start(({ finished }) => {
        // Only proceed if this is still the current animation
        // and the component is still mounted and the animation finished normally
        if (isSubscribed && animationStateRef.current.animationId === animationId && finished) {
          // Mark animation as completed
          animationStateRef.current.isAnimating = false;
          animationStateRef.current.animationInstance = null;
          // Generate a new animation ID for the next cycle
          animationStateRef.current.animationId = Math.random().toString(36).substring(7);
          // Restart animation when done
          animate();
        }
      });
    };

    // Start the animation
    animate();

    return () => {
      // Mark as unsubscribed but don't stop ongoing animations
      // This allows animations to continue during transitions
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
        color="rgba(255, 255, 255, 0.25)" 
      />
    </Animated.View>
  );
};

const LeafBackground = React.memo(({ customDensity }) => {
  // Get density from context, but allow override with prop
  const { isAnimating, density: contextDensity } = useLeafAnimation();
  const density = customDensity || contextDensity;
  
  // Store the current animation state in a ref to persist during re-renders
  const animationStateRef = useRef({
    isAnimating,
    density
  });
  
  // Update the ref when props change
  useEffect(() => {
    animationStateRef.current = {
      isAnimating,
      density
    };
  }, [isAnimating, density]);
  
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
  
  // Move useMemo hook before the conditional return
  const leafConfigs = React.useMemo(() => {
    if (!isAnimating || density === 'none') {
      return [];
    }
    
    const configs = [];
    // Main leaves
    for (let i = 0; i < leafCounts.main; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9) * height,
        delay: i * 180,
        duration: getRandomInRange(18000, 22000),
        size: getRandomInRange(16, 40),
        rotation: getRandomInRange(0, 360),
        opacity: getRandomInRange(0.15, 0.3),
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
        opacity: getRandomInRange(0.1, 0.2),
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
        opacity: getRandomInRange(0.1, 0.2),
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
        opacity: getRandomInRange(0.15, 0.3),
      });
    }
    return configs;
  }, [density, isAnimating, leafCounts]);
  
  // If animation is disabled in context or density is 'none', don't render leaves
  if (!isAnimating || density === 'none') {
    return null;
  }

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