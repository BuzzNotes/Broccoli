import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import { authStyles } from './styles';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';

export default function SignInScreen() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  
  const passwordRef = useRef(null);
  
  const { emailSignIn } = useAuth();

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
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignIn = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      await emailSignIn({
        email: formData.email,
        password: formData.password
      });

      // Navigation is handled in the emailSignIn function
    } catch (error) {
      console.error('Signin error:', error);
      
      // Handle specific Firebase error codes
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
            setErrors({ 
              general: 'Invalid email or password. Please try again.'
            });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address' });
            break;
          case 'auth/too-many-requests':
            setErrors({ 
              general: 'Too many failed login attempts. Please try again later or reset your password.' 
            });
            break;
          case 'auth/network-request-failed':
            setErrors({ 
              general: 'Network connection error. Please check your internet connection and try again.' 
            });
            break;
          default:
            setErrors({ 
              general: 'An error occurred during sign in. Please try again.' 
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
          onPress={() => router.push('/(auth)/login')}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>

        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back to your journey</Text>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.error}>{errors.general}</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                placeholder="Email"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({...formData, email: text});
                  if (errors.email) {
                    setErrors({...errors, email: null});
                  }
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />
              {renderError('email')}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                ref={passwordRef}
                style={[styles.input, errors.password && styles.inputError]}
                placeholder="Password"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({...formData, password: text});
                  if (errors.password) {
                    setErrors({...errors, password: null});
                  }
                }}
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
              />
              {renderError('password')}
            </View>

            <Pressable 
              style={styles.forgotPassword}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </Pressable>
          </View>

          <View style={styles.bottomButtonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
              onPress={handleSignIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
              {!loading && <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />}
            </Pressable>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Pressable onPress={() => router.push('/(auth)/signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotPasswordText: {
    color: '#4FA65B',
    fontSize: 14,
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
  signupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  signupLink: {
    color: '#4FA65B',
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Bold',
    marginLeft: 4,
  },
}); 