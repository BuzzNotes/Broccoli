import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import { authStyles } from './styles';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const { resetPassword } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleResetPassword = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});
      setSuccess(false);

      await resetPassword(email);
      setSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
      
      // Handle specific Firebase error codes
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
            setErrors({ 
              email: 'No account found with this email address'
            });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address' });
            break;
          case 'auth/too-many-requests':
            setErrors({ 
              general: 'Too many requests. Please try again later.' 
            });
            break;
          case 'auth/network-request-failed':
            setErrors({ 
              general: 'Network connection error. Please check your internet connection and try again.' 
            });
            break;
          default:
            setErrors({ 
              general: 'An error occurred. Please try again.' 
            });
        }
      } else {
        setErrors({ 
          general: 'An unexpected error occurred. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderError = (fieldName) => {
    if (errors[fieldName]) {
      return <Text style={styles.fieldError}>{errors[fieldName]}</Text>;
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A1A', '#1A1A2E']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <View style={styles.backgroundVector}>
        <BackgroundVector />
      </View>

      <SafeAreaView style={styles.contentContainer}>
        <Pressable 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.error}>{errors.general}</Text>
              </View>
            )}
            {success && (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#4FA65B" />
                <Text style={styles.successText}>
                  Password reset email sent! Check your inbox for instructions.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) {
                    setErrors({...errors, email: null});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
              />
              {renderError('email')}
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
              {!loading && <Ionicons name="send-outline" size={20} color="white" style={styles.buttonIcon} />}
            </Pressable>

            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Remember your password? </Text>
              <Pressable onPress={() => router.push('/(auth)/signin')}>
                <Text style={styles.signInLink}>Sign In</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  backgroundVector: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.6,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    color: 'white',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  error: {
    color: '#FF6B6B',
    textAlign: 'left',
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 166, 91, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  successText: {
    color: '#4FA65B',
    textAlign: 'left',
    flex: 1,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  form: {
    width: '100%',
    gap: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  input: {
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
    color: 'white',
    fontSize: 16,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  inputError: {
    borderColor: '#FF6B6B',
    borderWidth: 1,
  },
  fieldError: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  bottomButtonContainer: {
    marginTop: 'auto',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  button: {
    height: 56,
    backgroundColor: '#4FA65B',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  signInText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  signInLink: {
    color: '#4FA65B',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    marginLeft: 4,
  },
}); 