import { StyleSheet, Dimensions } from 'react-native';
import { colors } from './colors';
import { typography } from './typography';

const { width } = Dimensions.get('window');

export const standaloneStyles = StyleSheet.create({
  // Start Streak Screen
  startStreak: {
    safeArea: {
      flex: 1,
      backgroundColor: colors.gradientStart,
    },
    logo: {
      fontSize: typography.sizes.xl,
      color: colors.text.primary,
      fontFamily: typography.fonts.bold,
      letterSpacing: typography.letterSpacing.wide,
    },
    button: {
      width: width * 0.8,
    },
  },
  
  // Relapse Screen
  relapse: {
    cycleContainer: {
      backgroundColor: colors.background.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 32,
    },
    cycleTitle: {
      fontSize: typography.sizes.xl,
      color: colors.text.primary,
      fontFamily: typography.fonts.bold,
      marginBottom: 16,
    },
    cycleItem: {
      marginBottom: 16,
    },
  },
}); 