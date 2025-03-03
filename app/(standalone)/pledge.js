import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  SafeAreaView, 
  Animated,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Video } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  interpolate,
  Easing
} from 'react-native-reanimated';
import ConfettiAnimation from '../../src/components/ConfettiAnimation';
import { typography } from '../styles/typography';
import Svg, { Circle } from 'react-native-svg';

// Pledge quotes
const pledgeQuotes = [
  "Every day sober is a victory worth celebrating.",
  "Your strength grows with each moment of resistance.",
  "Sobriety is the greatest gift you can give yourself.",
  "Clear mind, bright future - one day at a time.",
  "You are stronger than your strongest urge.",
  "The journey of recovery is paved with small victories.",
  "Freedom comes when you break the chains of addiction.",
  "Your potential is limitless when your mind is clear.",
  "Each day sober is a masterpiece you're creating.",
  "The best version of you is the sober version of you."
];

// Constants
const PLEDGE_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const PLEDGE_STORAGE_KEY = 'lastPledgeTime';

// Initial text
const INITIAL_TEXT = "Making a pledge strengthens your commitment to sobriety. Take a moment to reflect on why this journey matters to you.";

// Cloud background component (similar to meditate.js)
const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const Cloud = ({ startDelay, duration, startY, size = 64 }) => {
  const position = useRef(new Animated.ValueXY({ x: -size, y: startY })).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.delay(startDelay),
        Animated.parallel([
          Animated.timing(position.x, {
            toValue: Dimensions.get('window').width + size,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.7,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
            Animated.delay(duration * 0.6),
            Animated.timing(opacity, {
              toValue: 0,
              duration: duration * 0.2,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => {
        position.setValue({ x: -size, y: getRandomInRange(0, Dimensions.get('window').height) });
        animate();
      });
    };

    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.cloud,
        {
          transform: [
            { translateX: position.x },
            { translateY: position.y },
          ],
          opacity,
          width: size,
          height: size,
        },
      ]}
    >
      <Ionicons name="leaf" size={size} color="rgba(79, 166, 91, 0.5)" />
    </Animated.View>
  );
};

const CloudBackground = React.memo(() => {
  const { width, height } = Dimensions.get('window');
  const clouds = [];

  for (let i = 0; i < 10; i++) {
    clouds.push(
      <Cloud
        key={i}
        startDelay={getRandomInRange(0, 5000)}
        duration={getRandomInRange(15000, 30000)}
        startY={getRandomInRange(0, height)}
        size={getRandomInRange(32, 64)}
      />
    );
  }

  return <>{clouds}</>;
});

// Progress Circle Component
const ProgressCircle = ({ progress }) => {
  const circleRadius = 120;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.progressCircleContainer}>
      <Svg width={circleRadius * 2 + strokeWidth} height={circleRadius * 2 + strokeWidth}>
        {/* Background Circle */}
        <Circle
          cx={circleRadius + strokeWidth/2}
          cy={circleRadius + strokeWidth/2}
          r={circleRadius}
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Circle */}
        <Circle
          cx={circleRadius + strokeWidth/2}
          cy={circleRadius + strokeWidth/2}
          r={circleRadius}
          stroke="rgba(79, 166, 91, 0.8)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          transform={`rotate(-90, ${circleRadius + strokeWidth/2}, ${circleRadius + strokeWidth/2})`}
        />
      </Svg>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressTimeLabel}>Next pledge in</Text>
        <Text style={styles.progressTimeValue}>{formatTimeRemaining(progress)}</Text>
      </View>
    </View>
  );
};

// Format time remaining based on progress
const formatTimeRemaining = (progress) => {
  if (progress >= 1) return "Available Now";
  
  const timeRemaining = PLEDGE_INTERVAL * (1 - progress);
  const hours = Math.floor(timeRemaining / (60 * 60 * 1000));
  const minutes = Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000));
  
  return `${hours}h ${minutes}m`;
};

const PledgeScreen = () => {
  const [currentQuote, setCurrentQuote] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [showCongrats, setShowCongrats] = useState(false);
  const [lastPledgeTime, setLastPledgeTime] = useState(0);
  const [pledgeProgress, setPledgeProgress] = useState(1); // 1 means available, 0 means just pledged
  const [canPledge, setCanPledge] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  // Rainbow button animation
  const rainbowAnimation = useSharedValue(0);
  
  // Load last pledge time on mount
  useEffect(() => {
    const loadLastPledgeTime = async () => {
      try {
        const storedTime = await AsyncStorage.getItem(PLEDGE_STORAGE_KEY);
        if (storedTime) {
          const lastTime = parseInt(storedTime, 10);
          setLastPledgeTime(lastTime);
          
          // Calculate initial progress
          const now = Date.now();
          const elapsed = now - lastTime;
          const initialProgress = Math.min(elapsed / PLEDGE_INTERVAL, 1);
          setPledgeProgress(initialProgress);
          setCanPledge(initialProgress >= 1);
        } else {
          // No previous pledge, can pledge immediately
          setPledgeProgress(1);
          setCanPledge(true);
        }
      } catch (error) {
        console.error('Error loading last pledge time:', error);
        // Default to allowing pledge if there's an error
        setPledgeProgress(1);
        setCanPledge(true);
      }
    };
    
    loadLastPledgeTime();
  }, []);
  
  // Update progress timer
  useEffect(() => {
    if (pledgeProgress < 1) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastPledgeTime;
        const newProgress = Math.min(elapsed / PLEDGE_INTERVAL, 1);
        
        setPledgeProgress(newProgress);
        
        if (newProgress >= 1) {
          setCanPledge(true);
          clearInterval(interval);
        }
      }, 60000); // Update every minute
      
      return () => clearInterval(interval);
    }
  }, [lastPledgeTime, pledgeProgress]);
  
  // Video fade in animation
  useEffect(() => {
    if (isVideoReady) {
      Animated.timing(fadeAnim, {
        toValue: 0.8,
        duration: 3000,
        useNativeDriver: true,
      }).start();
    }
  }, [isVideoReady]);
  
  // Start rainbow animation
  useEffect(() => {
    rainbowAnimation.value = 0;
    rainbowAnimation.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1, // Infinite repeat
      false // No reverse
    );
  }, []);
  
  // Quote animation sequence
  const animateQuote = () => {
    // Reset position
    quoteAnim.setValue(0);
    floatAnim.setValue(0);

    // Fade in and float animation
    Animated.parallel([
      Animated.timing(quoteAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ]).start();
  };
  
  // Quote rotation effect
  useEffect(() => {
    let interval = setInterval(() => {
      // Fade out current quote
      Animated.timing(quoteAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuote(prev => (prev + 1) % pledgeQuotes.length);
        animateQuote();
      });
    }, 8000); // Show each quote for 8 seconds

    // Start initial animation
    animateQuote();
    
    return () => clearInterval(interval);
  }, []);
  
  const handleBack = () => {
    router.back();
  };
  
  const handlePledgeConfirm = async () => {
    if (!canPledge) {
      // Provide feedback that they can't pledge yet
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    // Save the current time as the last pledge time
    const now = Date.now();
    await AsyncStorage.setItem(PLEDGE_STORAGE_KEY, now.toString());
    setLastPledgeTime(now);
    setPledgeProgress(0);
    setCanPledge(false);
    
    // Hide confetti first (if it's already showing)
    setShowConfetti(false);
    
    // Use setTimeout to ensure state updates before showing again
    setTimeout(() => {
      // Generate a new key to force animation to replay
      setConfettiKey(prevKey => prevKey + 1);
      
      // Show confetti animation
      setShowConfetti(true);
      
      // Provide haptic feedback for confirmation
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Show congrats screen
      setShowCongrats(true);
    }, 50);
  };
  
  // Handle when confetti animation finishes
  const handleConfettiFinish = () => {
    setShowConfetti(false);
  };
  
  // Rainbow button animation style
  const rainbowAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: interpolate(
        rainbowAnimation.value,
        [0, 1],
        [-200, 200]
      )}]
    };
  });
  
  const renderPledgeContent = () => {
    if (showCongrats) {
      return (
        <View style={styles.congratsContainer}>
          <Ionicons 
            name="heart" 
            size={120} 
            color="rgba(79,166,91,0.8)" 
            style={styles.heartIcon} 
          />
          <Text style={styles.congratsTitle}>Pledge Confirmed!</Text>
          <Text style={styles.congratsText}>
            You've made a powerful commitment to your sobriety journey.
            {'\n\n'}
            Remember this feeling of determination and strength.
          </Text>
          <Pressable 
            style={styles.returnButton}
            onPress={handleBack}
          >
            <Text style={styles.returnButtonText}>Return Home</Text>
          </Pressable>
        </View>
      );
    }
    
    return (
      <View style={styles.pledgeContainer}>
        {/* Progress Circle */}
        <ProgressCircle progress={pledgeProgress} />
        
        <View style={styles.quoteSection}>
          <Animated.View style={[
            styles.quoteContainer,
            {
              opacity: quoteAnim,
              transform: [{ translateY: floatAnim }]
            }
          ]}>
            <Text style={styles.quote}>{pledgeQuotes[currentQuote]}</Text>
          </Animated.View>
        </View>
        
        <View style={styles.pledgeButtonContainer}>
          <Pressable 
            style={[
              styles.pledgeButton,
              !canPledge && styles.pledgeButtonDisabled
            ]}
            onPress={handlePledgeConfirm}
          >
            <Animated.View style={[
              StyleSheet.absoluteFill, 
              rainbowAnimatedStyle,
              !canPledge && { opacity: 0.5 }
            ]}>
              <LinearGradient
                colors={['#FF5F6D', '#FFC371', '#4FA65B', '#00C9FF', '#9D50BB', '#FF5F6D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: 400, height: '100%' }}
              />
            </Animated.View>
            <Text style={styles.pledgeButtonText}>
              {canPledge ? 'PLEDGE NOW' : 'PLEDGED TODAY'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Background Video */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <Video
          source={require('../../app/Backgrounds/MeditateBackground.mp4')}
          style={StyleSheet.absoluteFill}
          shouldPlay
          isLooping
          isMuted
          rate={0.5}
          resizeMode="cover"
          onReadyForDisplay={() => setIsVideoReady(true)}
        />
      </Animated.View>
      
      {/* Floating Leaves Layer */}
      <CloudBackground />
      
      {/* Confetti Animation */}
      {showConfetti && (
        <ConfettiAnimation 
          animationKey={confettiKey} 
          onAnimationFinish={handleConfettiFinish} 
        />
      )}
      
      {/* Content Layer */}
      <View style={[styles.contentLayer, { zIndex: 2 }]}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Daily Sobriety Pledge</Text>
        </View>
        
        {renderPledgeContent()}
      </View>
    </SafeAreaView>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
    marginLeft: 8,
  },
  pledgeContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    width: '100%',
    alignItems: 'center',
  },
  progressCircleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  progressTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTimeLabel: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  progressTimeValue: {
    fontSize: 24,
    color: 'rgba(0,0,0,0.8)',
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 4,
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  quoteContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  quote: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  pledgeButtonContainer: {
    width: '100%',
    paddingBottom: 40,
    alignItems: 'center',
  },
  pledgeButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 200,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  pledgeButtonDisabled: {
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  pledgeButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heartIcon: {
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  congratsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  congratsTitle: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.4)',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 18,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  returnButton: {
    backgroundColor: 'rgba(79,166,91,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(79,166,91,0.3)',
  },
  returnButtonText: {
    fontSize: 18,
    color: 'rgba(79,166,91,0.8)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cloud: {
    position: 'absolute',
    zIndex: 5,
  },
  contentLayer: {
    flex: 1,
  },
});

export default PledgeScreen; 