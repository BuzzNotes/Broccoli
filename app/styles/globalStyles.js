import { StyleSheet, Platform } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';

export const globalStyles = StyleSheet.create({
  // Container Styles
  safeArea: {
    flex: 1,
    backgroundColor: colors.background.dark,
  },
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  
  // Button Styles
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.overlay,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    justifyContent: 'center',
  },
  dangerButton: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  
  // Text Styles
  title: {
    fontSize: typography.sizes.xxxl,
    color: colors.text.primary,
    fontFamily: typography.fonts.bold,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    marginBottom: 32,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: typography.sizes.lg,
    fontFamily: typography.fonts.bold,
  },
  
  // Layout Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 