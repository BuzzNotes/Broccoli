import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, SafeAreaView, Animated } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../app/styles/colors';

export default function GoodNewsScreen() {
  const bounceAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const bounceAnimation = Animated.sequence([
      Animated.delay(1000),
      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ),
    ]);

    bounceAnimation.start();

    return () => bounceAnimation.stop();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/questions/personal/age');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['rgba(79, 196, 191, 0.4)', '#4FA65B']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.content}>
        {/* Header Text */}
        <Text style={styles.title}>Good News!</Text>
        <Text style={styles.message}>
          We've built your profile. Your progress will be tracked here.
        </Text>

        {/* Profile Card */}
        <View style={styles.cardWrapper}>
          <View style={styles.sparkleContainer}>
            <Ionicons name="sparkles" size={32} color="#FFD700" />
          </View>
          <View style={styles.newBanner}>
            <Text style={styles.newText}>NEW</Text>
          </View>
          <LinearGradient
            colors={['#4FA65B', '#45E994']}
            style={[StyleSheet.absoluteFill, styles.card]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.userContainer}>
                <Ionicons name="leaf" size={20} color="white" style={styles.userIcon} />
                <Text style={styles.userName}>Rob Greenwood</Text>
              </View>
            </View>

            {/* Active Streak Section */}
            <Text style={styles.streakLabel}>Active Streak</Text>
            <Text style={styles.streakCount}>0 days</Text>

            {/* Footer Section */}
            <View style={styles.cardFooter}>
              <Text style={styles.freeSince}>
                Free since{'\n'}
                {new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' })}
              </Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={styles.subtitle}>
          Now, let's find out why you're struggling.
        </Text>

        {/* Next Button */}
        <Animated.View style={{ 
          width: '100%',
          transform: [{ scale: bounceAnim }]
        }}>
          <Pressable 
            style={({ pressed }) => [
              styles.nextButton,
              pressed && styles.nextButtonPressed
            ]}
            onPress={handleNext}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.buttonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </Pressable>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 40,
    color: '#1A1A2E',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 20,
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 28,
    opacity: 0.8,
  },
  cardWrapper: {
    width: '100%',
    aspectRatio: 1.6,
    marginBottom: 40,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  sparkleContainer: {
    position: 'absolute',
    top: -15,
    right: '15%',
    transform: [{ rotate: '15deg' }],
    zIndex: 2,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  newBanner: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  newText: {
    color: '#000',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
  },
  card: {
    padding: 24,
    borderRadius: 24,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 40,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  userIcon: {
    marginRight: 8,
  },
  userName: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  streakLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  streakCount: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 48,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardFooter: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  freeSince: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'right',
  },
  subtitle: {
    fontSize: 20,
    color: '#1A1A2E',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    gap: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  nextButtonPressed: {
    transform: [{ scale: 0.98 }],
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 