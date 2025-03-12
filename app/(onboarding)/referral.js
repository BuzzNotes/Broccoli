import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  Pressable, 
  Animated, 
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';

const ReferralScreen = () => {
  const [referralCode, setReferralCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const inputRef = useRef(null);
  
  // Get the leaf animation context
  const { changeDensity } = useLeafAnimation();
  
  useEffect(() => {
    // Set leaf density to low for this screen
    changeDensity('low');
    
    // Animate the content in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSubmit = async () => {
    if (!referralCode.trim()) {
      setError('Please enter a referral code');
      return;
    }
    
    setError('');
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Here you would typically validate the referral code with your backend
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Navigate to the benefits page
      router.push('/(onboarding)/benefits');
    } catch (err) {
      setError('Invalid referral code. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(onboarding)/benefits');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#0A0A1A', '#1A1A2E']}
          style={StyleSheet.absoluteFill}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <Animated.View 
            style={[
              styles.content, 
              { 
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }] 
              }
            ]}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Got a referral code?</Text>
              <Text style={styles.subtitle}>
                If someone referred you to Broccoli, enter their code below to give you both a reward.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <View style={styles.inputWrapper}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  placeholder="Enter referral code"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={10}
                />
                {referralCode.length > 0 && (
                  <Pressable 
                    style={styles.clearButton}
                    onPress={() => setReferralCode('')}
                  >
                    <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                  </Pressable>
                )}
              </View>
              
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
            </View>

            <View style={styles.buttonContainer}>
              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                  (!referralCode.trim() || isSubmitting) && styles.buttonDisabled
                ]}
                onPress={handleSubmit}
                disabled={!referralCode.trim() || isSubmitting}
              >
                <LinearGradient
                  colors={['#4FA65B', '#025A5C']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                {isSubmitting ? (
                  <Text style={styles.buttonText}>Verifying...</Text>
                ) : (
                  <Text style={styles.buttonText}>Apply Code</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.skipButton,
                  pressed && styles.skipButtonPressed
                ]}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>I don't have a code</Text>
              </Pressable>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 26,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 40,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    height: '100%',
  },
  clearButton: {
    padding: 8,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  skipButton: {
    padding: 12,
  },
  skipButtonPressed: {
    opacity: 0.7,
  },
  skipText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default ReferralScreen; 