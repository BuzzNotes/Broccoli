import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, LinearGradient, Ellipse } from 'react-native-svg';

const LottieAnimation = ({ children, secondsProgress = 0 }) => {
  // Animation values for pulsing effect
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Calculate the progress for the ring (0 to 1 based on seconds in a minute)
  const ringProgress = secondsProgress / 60;
  
  // Circle dimensions - further reduced to fit better on screen
  const size = 230;
  const centerPoint = size / 2;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  
  // Set up the pulsing animation and progress animation
  useEffect(() => {
    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    
    // Progress animation - animate to the current progress value
    Animated.timing(progressAnim, {
      toValue: ringProgress,
      duration: 500, // Smooth transition over 500ms
      useNativeDriver: false,
    }).start();
    
    pulseAnimation.start();
    
    return () => {
      pulseAnimation.stop();
    };
  }, [ringProgress]); // Re-run when ringProgress changes

  // Interpolate the pulse animation for scale
  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.01], // Very subtle pulse effect
  });
  
  // Interpolate the progress animation for stroke dash offset
  const animatedStrokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <View style={styles.container}>
      {/* Animated container for the pulsing effect */}
      <Animated.View
        style={[
          styles.pulseContainer,
          {
            transform: [{ scale: pulseScale }],
          },
        ]}
      >
        {/* Main glowing circle */}
        <Svg width={size} height={size} style={styles.circleSvg}>
          <Defs>
            {/* Enhanced radial gradient with more color stops and better transitions */}
            <RadialGradient
              id="enhancedGlowGradient"
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
              fx="40%"
              fy="40%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0%" stopColor="#BDFFD3" stopOpacity="1" />
              <Stop offset="30%" stopColor="#A7F3C1" stopOpacity="1" />
              <Stop offset="60%" stopColor="#7EEEA0" stopOpacity="1" />
              <Stop offset="80%" stopColor="#5BBD68" stopOpacity="1" />
              <Stop offset="100%" stopColor="#4FA65B" stopOpacity="0.9" />
            </RadialGradient>
            
            {/* Linear gradient for shimmer effect */}
            <LinearGradient
              id="shimmerGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0)" />
              <Stop offset="45%" stopColor="rgba(255, 255, 255, 0)" />
              <Stop offset="50%" stopColor="rgba(255, 255, 255, 0.4)" />
              <Stop offset="55%" stopColor="rgba(255, 255, 255, 0)" />
              <Stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </LinearGradient>
            
            {/* Gradient for the progress ring */}
            <LinearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
              gradientTransform="rotate(90)"
            >
              <Stop offset="0%" stopColor="#00E676" stopOpacity="1" />
              <Stop offset="50%" stopColor="#00C853" stopOpacity="1" />
              <Stop offset="100%" stopColor="#00E676" stopOpacity="1" />
            </LinearGradient>
          </Defs>
          
          {/* Main glowing circle with enhanced gradient */}
          <Circle
            cx={centerPoint}
            cy={centerPoint}
            r={radius}
            fill="url(#enhancedGlowGradient)"
          />
          
          {/* Shimmer overlay with increased opacity */}
          <Circle
            cx={centerPoint}
            cy={centerPoint}
            r={radius}
            fill="url(#shimmerGradient)"
            fillOpacity="0.7"
          />
          
          {/* Inner highlight for depth - moved slightly for better 3D effect */}
          <Ellipse
            cx={centerPoint - 5}
            cy={centerPoint - 15}
            rx={radius * 0.5}
            ry={radius * 0.3}
            fill="rgba(255, 255, 255, 0.15)"
            rotation={15}
            origin={`${centerPoint}, ${centerPoint}`}
          />
          
          {/* Progress ring with gradient and glow effect */}
          <AnimatedCircle
            cx={centerPoint}
            cy={centerPoint}
            r={radius}
            stroke="url(#progressGradient)"
            strokeWidth={4}
            strokeDasharray={circumference}
            strokeDashoffset={animatedStrokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform={`rotate(-90 ${centerPoint} ${centerPoint})`}
          />
        </Svg>
      </Animated.View>
      
      {children && (
        <View style={styles.contentContainer}>
          {children}
        </View>
      )}
    </View>
  );
};

// Create an animated version of the SVG Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  container: {
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 0,
    overflow: 'hidden',
  },
  pulseContainer: {
    width: 230,
    height: 230,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    overflow: 'hidden',
  },
  circleSvg: {
    position: 'absolute',
    zIndex: 5,
  },
  contentContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LottieAnimation;