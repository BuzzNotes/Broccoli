import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  interpolate,
  withTiming,
  Easing,
  useAnimatedProps,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { typography } from '../../app/styles/typography';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.85;
const STROKE_WIDTH = 12;
const STROKE_WIDTH_CIRCLE = 12;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const TimerDisplay = ({ timeElapsed, onReset }) => {
  const progress = useSharedValue(0);
  const scale = useSharedValue(1);
  const pulseAnim = useSharedValue(1);

  // Update progress based on seconds
  useEffect(() => {
    progress.value = withTiming(timeElapsed.seconds / 60, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [timeElapsed.seconds]);

  // Start continuous pulse animation
  useEffect(() => {
    pulseAnim.value = 1;
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) }),
        withTiming(1, { duration: 1500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      ),
      -1, // Infinite repeat
      true // Reverse animation
    );
  }, []);

  // Animated props for the progress circle
  const animatedProps = useAnimatedProps(() => {
    const circumference = 2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2);
    return {
      strokeDashoffset: circumference * (1 - progress.value),
    };
  });

  // Handle press animation
  const handlePressIn = () => {
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { scale: pulseAnim.value }
    ],
  }));

  // Format time values
  const formatNumber = (num) => String(num).padStart(2, '0');

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.shadowContainer}>
        <Pressable
          onPress={onReset}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={styles.pressable}
        >
          {/* Video Background */}
          <Video
            source={require('../../app/Backgrounds/UpdatedBackground.mp4')}
            style={[StyleSheet.absoluteFill, { width: CIRCLE_SIZE, height: CIRCLE_SIZE, borderRadius: CIRCLE_SIZE / 2 }]}
            resizeMode="cover"
            isLooping
            shouldPlay
            isMuted
          />

          <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE} style={[styles.svg, { transform: [{ rotate: '0deg' }] }]}>
            <Defs>
              <SvgGradient id="circleGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="rgba(26, 80, 50, 0.1)" />
                <Stop offset="0.5" stopColor="rgba(35, 107, 66, 0.1)" />
                <Stop offset="1" stopColor="rgba(44, 134, 82, 0.1)" />
              </SvgGradient>
              <SvgGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#5BCD6B" />
                <Stop offset="1" stopColor="#4FA65B" />
              </SvgGradient>
              <SvgGradient id="glowGrad" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#5BCD6B" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#4FA65B" stopOpacity="0" />
              </SvgGradient>
              <SvgGradient id="glowGrad2" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#5BCD6B" stopOpacity="0.15" />
                <Stop offset="1" stopColor="#4FA65B" stopOpacity="0" />
              </SvgGradient>
            </Defs>
            
            {/* Outer glow effect */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
              stroke="url(#glowGrad2)"
              strokeWidth={STROKE_WIDTH + 16}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)} ${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)}`}
              animatedProps={animatedProps}
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
            
            {/* Inner glow effect */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
              stroke="url(#glowGrad)"
              strokeWidth={STROKE_WIDTH + 8}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)} ${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)}`}
              animatedProps={animatedProps}
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
            
            {/* Background circle with fill */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
              fill="url(#circleGrad)"
              stroke="rgb(91, 205, 106)"
              strokeWidth={STROKE_WIDTH_CIRCLE}
            />
            
            {/* Background stroke */}
            <Circle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
              stroke="rgba(20, 60, 37, 0.6)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              fill="transparent"
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
            
            {/* Progress circle */}
            <AnimatedCircle
              cx={CIRCLE_SIZE / 2}
              cy={CIRCLE_SIZE / 2}
              r={(CIRCLE_SIZE - STROKE_WIDTH) / 2}
              stroke="url(#progressGrad)"
              strokeWidth={STROKE_WIDTH}
              strokeLinecap="round"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)} ${2 * Math.PI * ((CIRCLE_SIZE - STROKE_WIDTH) / 2)}`}
              animatedProps={animatedProps}
              transform={`rotate(-90 ${CIRCLE_SIZE / 2} ${CIRCLE_SIZE / 2})`}
            />
          </Svg>

          <View style={styles.content}>
            <View style={styles.timeContainer}>
              {/* All units except seconds */}
              <View style={styles.upperUnitsRow}>
                {timeElapsed.days > 0 && (
                  <>
                    <View style={styles.timeUnit}>
                      <Text style={styles.smallTimeValue}>{formatNumber(timeElapsed.days)}</Text>
                      <Text style={styles.timeLabel}>days</Text>
                    </View>
                    <Text style={styles.unitSeparator}>:</Text>
                  </>
                )}
                
                {timeElapsed.hours > 0 && (
                  <>
                    <View style={styles.timeUnit}>
                      <Text style={styles.smallTimeValue}>{formatNumber(timeElapsed.hours)}</Text>
                      <Text style={styles.timeLabel}>hours</Text>
                    </View>
                    <Text style={styles.unitSeparator}>:</Text>
                  </>
                )}
                
                <View style={styles.timeUnit}>
                  <Text style={styles.smallTimeValue}>{formatNumber(timeElapsed.minutes)}</Text>
                  <Text style={styles.timeLabel}>min</Text>
                </View>
              </View>

              {/* Seconds display */}
              <View style={styles.secondsContainer}>
                <Text style={styles.largeTimeValue}>{formatNumber(timeElapsed.seconds)}</Text>
                <Text style={styles.secondsLabel}>seconds</Text>
              </View>
            </View>

            <View style={styles.resetButton}>
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            </View>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  shadowContainer: {
    shadowColor: '#143C25',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12, // for Android
  },
  pressable: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: CIRCLE_SIZE / 2,
  },
  svg: {
    position: 'absolute',
    transform: [{ rotate: '-90deg' }],
  },
  content: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  upperUnitsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: 8,
    opacity: 0.7,
  },
  timeUnit: {
    alignItems: 'center',
    marginHorizontal: 4,
  },
  smallTimeValue: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
    lineHeight: 38,
  },
  largeTimeValue: {
    fontSize: 96,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    includeFontPadding: false,
    lineHeight: 104,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  timeLabel: {
    fontSize: 10,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: -2,
  },
  secondsLabel: {
    fontSize: 16,
    fontFamily: typography.fonts.medium,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: -6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2
  },
  unitSeparator: {
    fontSize: 32,
    fontFamily: typography.fonts.bold,
    color: '#FFFFFF',
    marginBottom: 16,
    marginHorizontal: 2,
    includeFontPadding: false,
    opacity: 0.7,
  },
  secondsContainer: {
    alignItems: 'center',
    marginTop: 0,
  },
  resetButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default TimerDisplay; 