import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { Video } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';

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

const MeditateScreen = () => {
  const [meditationType, setMeditationType] = useState(null);
  const [currentQuote, setCurrentQuote] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;
  const [isVideoReady, setIsVideoReady] = useState(false);

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
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartSelf = () => {
    if (!isTimerRunning) {
      setTimer(0);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const handleEndMeditation = () => {
    setIsTimerRunning(false);
    setShowCongrats(true);
  };

  const handleBack = () => {
    router.back();
  };

  const renderSelfGuided = () => {
    if (showCongrats) {
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
          <View>
            <Animated.View style={[
              styles.quoteContainer,
              {
                opacity: quoteAnim,
                transform: [{ translateY: floatAnim }]
              }
            ]}>
              <Text style={styles.quote}>{meditationQuotes[currentQuote]}</Text>
            </Animated.View>
            <Text style={styles.timerText}>{formatTime(timer)}</Text>
          </View>
        )}
        <View style={styles.buttonRow}>
          <Pressable 
            style={[styles.meditationButton, isTimerRunning && styles.activeButton]}
            onPress={handleStartSelf}
          >
            <Text style={[styles.buttonText, isTimerRunning && styles.activeButtonText]}>
              {isTimerRunning ? 'Pause' : 'Begin'}
            </Text>
          </Pressable>
          {isTimerRunning && (
            <Pressable 
              style={[styles.meditationButton, styles.endButton]}
              onPress={handleEndMeditation}
            >
              <Text style={[styles.buttonText, styles.endButtonText]}>End</Text>
            </Pressable>
          )}
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
            onPress={() => setMeditationType('guided')}
          >
            <Ionicons name="headset-outline" size={32} color="#000000" />
            <Text style={styles.optionTitle}>Guided</Text>
            <Text style={styles.optionSubtitle}>Follow along with guidance</Text>
          </Pressable>
        </View>
      ) : meditationType === 'self' ? (
        renderSelfGuided()
      ) : (
        // Guided Screen
        <View style={styles.meditationContainer}>
          {!isTimerRunning ? (
            <View style={styles.durationButtons}>
              <Text style={styles.durationTitle}>Choose Duration</Text>
              {[5, 10, 15].map(duration => (
                <Pressable
                  key={duration}
                  style={styles.durationButton}
                  onPress={() => handleStartGuided(duration)}
                >
                  <Text style={styles.durationButtonText}>{duration} Minutes</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>{formatTime(timer)}</Text>
              <Pressable 
                style={styles.stopButton}
                onPress={() => setIsTimerRunning(false)}
              >
                <Text style={styles.stopButtonText}>Stop</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
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
    alignItems: 'center',
    padding: 20,
  },
  initialText: {
    fontSize: 28,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    lineHeight: 40,
    marginBottom: 40,
  },
  quoteContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  quote: {
    fontSize: 32,
    color: 'rgba(0,0,0,0.7)',
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 24,
    color: 'rgba(0,0,0,0.6)',
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginTop: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
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
    backgroundColor: 'rgba(79,166,91,0.15)',
    borderColor: 'rgba(79,166,91,0.3)',
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
    color: 'rgba(79,166,91,0.8)',
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
    color: 'rgba(0,0,0,0.7)',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  congratsText: {
    fontSize: 18,
    color: 'rgba(0,0,0,0.6)',
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
});

export default MeditateScreen; 