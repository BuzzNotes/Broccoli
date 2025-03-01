import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans";
import { updateUserProfile } from '../../src/utils/userProfile';
import { useAuth } from '../../src/context/AuthContext';
import { colors } from '../styles/colors';
import { typography } from '../styles/typography';
import { BackgroundVector } from '../components/BackgroundVector';
import { StatusBar } from 'expo-status-bar';

export default function CompleteProfileScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const firstNameAnimation = React.useRef(new Animated.Value(0)).current;
  const lastNameAnimation = React.useRef(new Animated.Value(0)).current;
  const { user } = useAuth();
  
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
  });

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  // Animation for input focus
  useEffect(() => {
    if (focusedInput === 'firstName') {
      Animated.timing(firstNameAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      Animated.timing(lastNameAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else if (focusedInput === 'lastName') {
      Animated.timing(lastNameAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }).start();
      Animated.timing(firstNameAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(firstNameAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
      Animated.timing(lastNameAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [focusedInput, firstNameAnimation, lastNameAnimation]);

  const handleSubmit = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate form
      if (!formData.firstName.trim()) {
        setError('Please enter your first name');
        setLoading(false);
        return;
      }

      if (!formData.lastName.trim()) {
        setError('Please enter your last name');
        setLoading(false);
        return;
      }

      // Update user profile
      await updateUserProfile({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      });

      // Navigate to good news page
      router.push('/(onboarding)/good-news');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Main Background Gradient */}
        <LinearGradient
          colors={['#1A1A1A', '#2D2D2D']}
          style={styles.backgroundGradient}
        />

        {/* Overlay Gradient */}
        <LinearGradient
          colors={['rgba(79, 166, 91, 0.4)', 'rgba(79, 166, 91, 0)']}
          style={styles.overlayGradient}
        />

        {/* Background Vector */}
        <BackgroundVector />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <SafeAreaView style={styles.contentContainer}>
            {/* Header */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Welcome to Broccoli</Text>
              <Text style={styles.subtitle}>Let's complete your profile</Text>
            </View>

            {/* Form */}
            <View style={[styles.formContainer, keyboardVisible && styles.formContainerKeyboardOpen]}>
              <View style={styles.inputWrapper}>
                <Text style={styles.label}>First Name</Text>
                <Animated.View style={[
                  styles.inputContainer,
                  {
                    borderColor: firstNameAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255, 255, 255, 0.2)', colors.primary]
                    }),
                    shadowOpacity: firstNameAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.2]
                    })
                  }
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={focusedInput === 'firstName' ? colors.primary : colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Your first name"
                    placeholderTextColor={colors.text.muted}
                    value={formData.firstName}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, firstName: text }));
                      setError('');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('firstName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </Animated.View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.label}>Last Name</Text>
                <Animated.View style={[
                  styles.inputContainer,
                  {
                    borderColor: lastNameAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['rgba(255, 255, 255, 0.2)', colors.primary]
                    }),
                    shadowOpacity: lastNameAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.2]
                    })
                  }
                ]}>
                  <Ionicons 
                    name="person-outline" 
                    size={20} 
                    color={focusedInput === 'lastName' ? colors.primary : colors.text.secondary} 
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Your last name"
                    placeholderTextColor={colors.text.muted}
                    value={formData.lastName}
                    onChangeText={(text) => {
                      setFormData(prev => ({ ...prev, lastName: text }));
                      setError('');
                    }}
                    autoCapitalize="words"
                    autoCorrect={false}
                    onFocus={() => setFocusedInput('lastName')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </Animated.View>
              </View>

              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle-outline" size={20} color={colors.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}
            </View>

            {/* Continue Button */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.continueButton, (loading || !formData.firstName.trim() || !formData.lastName.trim()) && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading || !formData.firstName.trim() || !formData.lastName.trim()}
              >
                {loading ? (
                  <ActivityIndicator color={colors.text.primary} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.text.primary} style={styles.buttonIcon} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  overlayGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '53%',
    opacity: 0.8,
    zIndex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 2,
    justifyContent: 'space-between',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: typography.sizes.xxl,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.text.secondary,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans-Medium',
  },
  formContainer: {
    width: '100%',
    marginTop: 40,
    paddingHorizontal: 8,
  },
  formContainerKeyboardOpen: {
    marginTop: 20,
  },
  inputWrapper: {
    marginBottom: 24,
  },
  label: {
    fontSize: typography.sizes.md,
    color: colors.text.primary,
    marginBottom: 8,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    height: 60,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontFamily: 'PlusJakartaSans-Medium',
    height: '100%',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
    marginLeft: 8,
    fontSize: typography.sizes.sm,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    height: 60,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.md,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  buttonIcon: {
    marginLeft: 8,
  },
}); 