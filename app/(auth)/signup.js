import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, SafeAreaView, StyleSheet, Animated } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { BackgroundVector } from '../components/BackgroundVector';
import { authStyles } from './styles';
import { useAuth } from '../../src/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { FirebaseError } from 'firebase/app';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthdate: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const signupTimeout = useRef(null);
  
  // Add refs for each input field
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const birthdateRef = useRef(null);
  
  const { emailSignUp } = useAuth();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    return () => {
      if (signupTimeout.current) {
        clearTimeout(signupTimeout.current);
      }
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateBirthdate = (birthdate) => {
    const birthdateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
    if (!birthdateRegex.test(birthdate)) return false;
    
    const [month, day, year] = birthdate.split('/').map(Number);
    const date = new Date(year, month - 1, day);
    const now = new Date();
    
    // Check if it's a valid date and user is at least 13 years old
    return date.getMonth() === month - 1 && 
           date.getDate() === day && 
           date.getFullYear() === year &&
           now.getFullYear() - year >= 13;
  };

  const validateForm = () => {
    const newErrors = {};

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (!/\d/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }

    // Birthdate validation
    if (!formData.birthdate) {
      newErrors.birthdate = 'Birthdate is required';
    } else if (!validateBirthdate(formData.birthdate)) {
      newErrors.birthdate = 'Please enter a valid date (MM/DD/YYYY) - Must be 13 or older';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setErrors({});

      // Set a timeout to prevent infinite loading
      signupTimeout.current = setTimeout(() => {
        setLoading(false);
        setErrors({
          general: 'The request is taking longer than expected. Your account may have been created - try logging in, or try again in a few moments.'
        });
      }, 10000); // 10 second timeout

      await emailSignUp(formData);
      
      // Clear timeout if successful
      if (signupTimeout.current) {
        clearTimeout(signupTimeout.current);
      }

      router.push('/(onboarding)/good-news');
    } catch (error) {
      console.error('Signup error:', error);
      
      // Clear timeout on error
      if (signupTimeout.current) {
        clearTimeout(signupTimeout.current);
      }

      // Handle specific Firebase error codes
      if (error instanceof FirebaseError) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            setErrors({ 
              email: 'This email is already registered. Please try logging in instead.',
              general: 'Account already exists. You can try logging in with this email.'
            });
            break;
          case 'auth/invalid-email':
            setErrors({ email: 'Invalid email address' });
            break;
          case 'auth/weak-password':
            setErrors({ password: 'Password is too weak' });
            break;
          case 'auth/network-request-failed':
            setErrors({ 
              general: 'Network connection error. Please check your internet connection and try again.' 
            });
            break;
          case 'auth/timeout':
            setErrors({ 
              general: 'Request timeout. Please try again.' 
            });
            break;
          default:
            // Handle Firestore connection errors
            if (error.message?.includes('WebChannelConnection') || 
                error.message?.includes('write') || 
                error.message?.includes('transport errored')) {
              setErrors({ 
                general: 'Your account may have been created but we encountered a connection issue. Please try logging in, or try again in a few moments.' 
              });
            } else {
              setErrors({ 
                general: 'An error occurred during sign up. Please try again.' 
              });
            }
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands on their journey to recovery</Text>
            {errors.general && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#FF6B6B" />
                <Text style={styles.error}>{errors.general}</Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <TextInput
                  style={[styles.input, errors.firstName && styles.inputError]}
                  placeholder="First Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.firstName}
                  onChangeText={(text) => {
                    setFormData({...formData, firstName: text});
                    if (errors.firstName) {
                      setErrors({...errors, firstName: null});
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => lastNameRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {renderError('firstName')}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <TextInput
                  ref={lastNameRef}
                  style={[styles.input, errors.lastName && styles.inputError]}
                  placeholder="Last Name"
                  placeholderTextColor="rgba(255, 255, 255, 0.6)"
                  value={formData.lastName}
                  onChangeText={(text) => {
                    setFormData({...formData, lastName: text});
                    if (errors.lastName) {
                      setErrors({...errors, lastName: null});
                    }
                  }}
                  returnKeyType="next"
                  onSubmitEditing={() => emailRef.current?.focus()}
                  blurOnSubmit={false}
                />
                {renderError('lastName')}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                ref={emailRef}
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
                placeholder="Password (minimum 6 characters)"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({...formData, password: text});
                  if (errors.password) {
                    setErrors({...errors, password: null});
                  }
                }}
                secureTextEntry
                returnKeyType="next"
                onSubmitEditing={() => birthdateRef.current?.focus()}
                blurOnSubmit={false}
              />
              {renderError('password')}
            </View>

            <View style={styles.inputGroup}>
              <TextInput
                ref={birthdateRef}
                style={[styles.input, errors.birthdate && styles.inputError]}
                placeholder="Birthdate (MM/DD/YYYY)"
                placeholderTextColor="rgba(255, 255, 255, 0.6)"
                value={formData.birthdate}
                onChangeText={(text) => {
                  setFormData({...formData, birthdate: text});
                  if (errors.birthdate) {
                    setErrors({...errors, birthdate: null});
                  }
                }}
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
                keyboardType="numbers-and-punctuation"
              />
              {renderError('birthdate')}
            </View>
          </View>

          <View style={styles.bottomButtonContainer}>
            <Pressable 
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && styles.buttonPressed
              ]}
              onPress={handleSignUp}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
              {!loading && <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />}
            </Pressable>
            
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>Already have an account? </Text>
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
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
  form: {
    width: '100%',
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
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
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
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