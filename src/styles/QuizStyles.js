import { StyleSheet, Platform } from "react-native";

const QuizStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        // iOS-specific optimizations
        backfaceVisibility: 'hidden',
      },
    }),
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
    zIndex: 1,
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginVertical: 20,
  },
  questionNumber: {
    color: '#4FA65B',
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 16,
    marginBottom: 16,
  }
});

export default QuizStyles; 