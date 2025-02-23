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
    marginBottom: 100,
  },
  logo: {
    fontSize: typography.sizes.xxxl,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    letterSpacing: typography.letterSpacing.wide,
    textAlign: 'center',
    marginBottom: 0,
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
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 16,
    marginBottom: 20,
    zIndex: 1,
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.overlay,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: 353,
  },
  appleButton: {
    backgroundColor: colors.text.primary,
  },
  googleButton: {
    backgroundColor: colors.text.primary,
  },
  emailButton: {
    backgroundColor: colors.text.primary,
  },
  buttonIcon: {
    marginRight: 12,
    width: 24,
    height: 24,
  },
  buttonText: {
    fontSize: typography.sizes.md,
    color: colors.text.font,
    fontFamily: typography.fonts.bold,
  },
  
  // Skip Button
  skipContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4FF47',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: 353,
  },
  skipText: {
    fontSize: typography.sizes.md,
    color: colors.text.font,
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
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
    color: '#FF4B4B',
    textAlign: 'center',
    marginBottom: 16,
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
}); 