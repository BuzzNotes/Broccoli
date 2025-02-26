import { StyleSheet, Platform } from 'react-native';
import { colors } from '../styles/colors';
import { LinearGradient } from 'expo-linear-gradient';
import { typography } from '../styles/typography';

export const authStyles = StyleSheet.create({
  // Container & Layout
  container: {
    flex: 1,
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    zIndex: 2, // Higher than overlay gradient
  },
  
  // Logo Section
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    fontSize: 40,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    lineHeight: 48,
  },
  tagline: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 0,
  },

  // Auth Buttons
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    gap: 20,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  appleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  googleButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emailButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  emailSignInButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(79, 166, 91, 0.4)', // Light green border to distinguish it
  },
  buttonIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
    color: colors.text.primary,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  
  // Skip Button
  skipContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 16,
    color: colors.text.secondary,
    fontFamily: 'PlusJakartaSans-Bold',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.text.muted,
  },
  dividerText: {
    fontSize: typography.sizes.sm,
    color: colors.text.muted,
    marginHorizontal: 16,
  },

  // Terms & Privacy
  
  vectorContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 360, // Adjust as needed
    zIndex: 0,
  },

  errorText: {
    color: colors.error,
    textAlign: 'center',
    marginTop: 16,
  },
  loader: {
    marginTop: 24,
  },

  skipToTimerButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
}); 