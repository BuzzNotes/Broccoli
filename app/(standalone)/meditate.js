import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../../src/config/firebase';
import { awardMeditationPoints } from '../../src/utils/achievementUtils';
import { doc, getDoc } from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const getRandomInRange = (min, max) => {
  return Math.random() * (max - min) + min;
};

const Cloud = ({ startDelay, duration, startY, size = 64 }) => {
  const position = useRef(new Animated.Value(-150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [randomOffset] = useState(() => getRandomInRange(-50, 50));

  useEffect(() => {
    let isSubscribed = true;

    const animate = () => {
      if (!isSubscribed) return;

      position.setValue(-150);
      opacity.setValue(0);
      
      const actualDuration = duration * getRandomInRange(0.8, 1.2);
      
      Animated.sequence([
        Animated.delay(startDelay),
        Animated.parallel([
          Animated.timing(position, {
            toValue: width + 150,
            duration: actualDuration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0.6,
              duration: actualDuration - 2000,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
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
        styles.cloud,
        {
          transform: [{ translateX: position }],
          opacity,
          top: startY + randomOffset,
          zIndex: 5,
        },
      ]}
    >
      <Ionicons 
        name="cloud" 
        size={size} 
        color="rgba(255, 255, 255, 0.9)" 
      />
    </Animated.View>
  );
};

const meditationQuotes = [
  "Let your thoughts drift away",
  "Focus on your breath",
  "Feel the peace within",
  "You are present, you are here",
  "Release all tension",
  "Each breath brings calm",
  "Your mind is clearing",
  "Find your center",
  "Let go of all worries",
  "You are becoming lighter"
];

const INITIAL_TEXT = "Clear your mind...\nGet comfortable..\nBegin when you're ready";

const CloudBackground = React.memo(() => {
  const cloudConfigs = React.useMemo(() => {
    const configs = [];
    for (let i = 0; i < 8; i++) {
      configs.push({
        y: getRandomInRange(0.1, 0.9),
        delay: i * 800,
        duration: getRandomInRange(20000, 30000),
        size: getRandomInRange(40, 120),
      });
    }
    return configs;
  }, []);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 1 }]}>
      {cloudConfigs.map((config, index) => (
        <Cloud
          key={index}
          startDelay={config.delay}
          duration={config.duration}
          startY={height * config.y}
          size={config.size}
        />
      ))}
    </View>
  );
});

const MeditateScreen = () => {
  const [meditationType, setMeditationType] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [meditationPoints, setMeditationPoints] = useState(null);
  const [notification, setNotification] = useState({ visible: false, message: '', type: 'info' });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);

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
    let interval;
    if (meditationType === 'self' && isTimerRunning) {
      interval = setInterval(() => {
        // Fade out current quote
        Animated.timing(quoteAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => {
          setCurrentQuote(prev => (prev + 1) % meditationQuotes.length);
          animateQuote();
        });
      }, 8000); // Show each quote for 8 seconds

      // Start initial animation
      animateQuote();
    }
    return () => clearInterval(interval);
  }, [meditationType, isTimerRunning]);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      const interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    }
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSelf = () => {
    setIsTimerRunning(prev => !prev);
    if (!isTimerRunning) {
      setTimer(0);
    }
  };

  // Function to show notification
  const showNotification = (message, type = 'info') => {
    setNotification({
      visible: true,
      message,
      type
    });
    
    // Auto-hide notification after 3 seconds
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const handleEndMeditation = async () => {
    setIsTimerRunning(false);
    
    // Only award points if meditation is longer than 1 minute and user is logged in
    if (timer >= 60 && auth.currentUser) {
      try {
        const userId = auth.currentUser.uid;
        const pointsResult = await awardMeditationPoints(userId, timer);
        
        setMeditationPoints(pointsResult);
        
        // Show notification if points were awarded
        if (pointsResult && !pointsResult.alreadyAwarded && !pointsResult.insufficientDuration) {
          showNotification('🌟 You earned 5 points for your meditation session!', 'success');
        } else if (pointsResult && pointsResult.alreadyAwarded) {
          showNotification('You\'ve already earned points today. Come back tomorrow!', 'info');
        }
      } catch (error) {
        console.error('Error awarding meditation points:', error);
      }
    }
    
    setShowCongrats(true);
  };

  const handleBack = () => {
    router.back();
  };

  const showGuidedComingSoon = () => {
    // Show notification for coming soon
    showNotification('Guided meditations will be available in a future update.', 'info');
    
    // Flash the coming soon banner
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const renderSelfGuided = () => {
    if (showCongrats) {
      let pointsMessage = '';
      
      if (meditationPoints) {
        if (meditationPoints.insufficientDuration) {
          pointsMessage = 'Meditate for at least 1 minute to earn points.';
        } else if (meditationPoints.alreadyAwarded) {
          pointsMessage = 'You\'ve already earned meditation points today. Come back tomorrow!';
        } else {
          pointsMessage = 'You earned 5 points for your meditation session!';
        }
      } else if (timer < 60) {
        pointsMessage = 'Meditate for at least 1 minute to earn points.';
      } else if (!auth.currentUser) {
        pointsMessage = 'Sign in to earn points for your meditation sessions!';
      }
      
      return (
        <View style={styles.congratsContainer}>
          <Ionicons 
            name="heart" 
            size={120} 
            color="rgba(79,166,91,0.8)" 
            style={styles.heartIcon} 
          />
          <Text style={styles.congratsTitle}>Wonderful Progress!</Text>
          <Text style={styles.congratsText}>
            You've taken another step towards better mental clarity and self-improvement.
            {'\n\n'}
            Time spent: {formatTime(timer)}
            {pointsMessage ? '\n\n' + pointsMessage : ''}
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
      <View style={styles.meditationContainer}>
        {!isTimerRunning ? (
          <Text style={styles.initialText}>{INITIAL_TEXT}</Text>
        ) : (
          <View style={styles.meditationContent}>
            <View style={styles.quoteSection}>
              <Animated.View style={[
                styles.quoteContainer,
                {
                  opacity: quoteAnim,
                  transform: [{ translateY: floatAnim }]
                }
              ]}>
                <Text style={styles.quote}>{meditationQuotes[currentQuote]}</Text>
              </Animated.View>
            </View>
            <View style={styles.controlsSection}>
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
              <View style={styles.buttonRow}>
                <Pressable 
                  style={[styles.meditationButton, styles.activeButton]}
                  onPress={handleStartSelf}
                >
                  <Text style={[styles.buttonText, styles.activeButtonText]}>
                    Pause
                  </Text>
                </Pressable>
                <Pressable 
                  style={[styles.meditationButton, styles.endButton]}
                  onPress={handleEndMeditation}
                >
                  <Text style={[styles.buttonText, styles.endButtonText]}>End</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
        {!isTimerRunning && (
          <View style={styles.buttonRow}>
            <Pressable 
              style={styles.meditationButton}
              onPress={handleStartSelf}
            >
              <Text style={styles.buttonText}>Begin</Text>
            </Pressable>
          </View>
        )}
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

      {/* Floating Clouds Layer */}
      <CloudBackground />

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <View style={styles.comingSoonBanner}>
          <Text style={styles.comingSoonText}>Coming Soon!</Text>
          <Text style={styles.comingSoonSubtext}>Guided meditations will be available in a future update.</Text>
        </View>
      )}

      {/* Notification Banner */}
      {notification.visible && (
        <View style={[
          styles.notificationBanner,
          notification.type === 'success' ? styles.successBanner : styles.infoBanner
        ]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

      {/* Content Layer */}
      <View style={[styles.contentLayer, { zIndex: 2 }]}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#000000" />
          </Pressable>
          <Text style={styles.headerTitle}>Meditation</Text>
        </View>

        {!meditationType ? (
          // Selection Screen
          <View style={styles.selectionContainer}>
            <Pressable 
              style={styles.optionButton}
              onPress={() => setMeditationType('self')}
            >
              <Ionicons name="leaf-outline" size={32} color="#000000" />
              <Text style={styles.optionTitle}>Self-Guided</Text>
              <Text style={styles.optionSubtitle}>Meditate at your own pace</Text>
            </Pressable>

            <Pressable 
              style={styles.optionButton}
              onPress={() => showGuidedComingSoon()}
            >
              <Ionicons name="headset-outline" size={32} color="#000000" />
              <Text style={styles.optionTitle}>Guided</Text>
              <Text style={styles.optionSubtitle}>Follow along with guidance</Text>
            </Pressable>
          </View>
        ) : meditationType === 'self' ? (
          renderSelfGuided()
        ) : (
          // Guided Screen (should never reach here now)
          <View style={styles.meditationContainer}>
            <View style={styles.comingSoonContainer}>
              <Ionicons name="construct-outline" size={48} color="#4CAF50" />
              <Text style={styles.comingSoonTitle}>Coming Soon!</Text>
              <Text style={styles.comingSoonDescription}>
                We're working hard to bring you guided meditations.
                Check back in a future update!
              </Text>
              <Pressable 
                style={styles.returnButton}
                onPress={() => setMeditationType(null)}
              >
                <Text style={styles.returnButtonText}>Back to Options</Text>
              </Pressable>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

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
  selectionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    gap: 20,
  },
  optionButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
    marginTop: 12,
  },
  optionSubtitle: {
    fontSize: 16,
    color: '#666666',
    marginTop: 4,
  },
  meditationContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    width: '100%',
  },
  meditationContent: {
    flex: 1,
    width: '100%',
  },
  quoteSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  controlsSection: {
    width: '100%',
    paddingBottom: 40,
    alignItems: 'center',
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
  timerText: {
    fontSize: 24,
    color: 'rgba(0,0,0,0.3)',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    width: '100%',
  },
  initialText: {
    fontSize: 28,
    color: 'rgba(0,0,0,0.4)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 40,
    marginBottom: 40,
  },
  meditationButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  activeButton: {
    backgroundColor: 'rgba(91,189,104,0.15)',
    borderColor: 'rgba(91,189,104,0.3)',
  },
  endButton: {
    backgroundColor: 'rgba(255,75,75,0.15)',
    borderColor: 'rgba(255,75,75,0.3)',
  },
  buttonText: {
    fontSize: 18,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  activeButtonText: {
    color: 'rgba(91,189,104,0.8)',
  },
  endButtonText: {
    color: 'rgba(255,75,75,0.8)',
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
    backgroundColor: 'rgba(91,189,104,0.15)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(91,189,104,0.3)',
  },
  returnButtonText: {
    fontSize: 18,
    color: 'rgba(91,189,104,0.8)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  durationButtons: {
    alignItems: 'center',
    gap: 16,
  },
  durationTitle: {
    fontSize: 24,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
  },
  durationButton: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  durationButtonText: {
    fontSize: 18,
    color: '#000000',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  timerContainer: {
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#FF4B4B',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
  },
  stopButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  cloud: {
    position: 'absolute',
    zIndex: 5,
  },
  contentLayer: {
    flex: 1,
  },
  comingSoonBanner: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  comingSoonText: {
    fontSize: 20,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  comingSoonTitle: {
    fontSize: 28,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  notificationBanner: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  successBanner: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
  },
  infoBanner: {
    backgroundColor: 'rgba(33, 150, 243, 0.9)',
  },
  notificationText: {
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default MeditateScreen; 