import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useFonts, PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans";
import { router } from 'expo-router';
import CustomButton from "../../src/components/CustomButton";
import LoadingScreen from "../../src/components/LoadingScreen";

export default function GoodNewsScreen() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded) return <LoadingScreen />;

  const handleNext = () => {
    // Force unmount of current screen before navigation
    requestAnimationFrame(() => {
      router.push('/(onboarding)/quiz/Question1');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Good News!</Text>
        <Text style={styles.subtitle}>
          We've built your profile. Your progress will be tracked here.
        </Text>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.qtrLabel}>QTR</Text>
            <View style={styles.iconPlaceholder} />
          </View>
          <Text style={styles.streakCount}>0 days</Text>
          <Text style={styles.freeSince}>
            Free since{'\n'}02/15
          </Text>
        </View>

        <Text style={styles.bottomText}>
          Now, let's find out why you're struggling.
        </Text>

        <CustomButton
          title="Next"
          onPress={handleNext}
          backgroundColor="#4285F4"
          textColor="#FFF"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  card: {
    width: '100%',
    aspectRatio: 1.5,
    backgroundColor: '#FF4B4B',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  qtrLabel: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  streakCount: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 36,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  freeSince: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
  },
  bottomText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
}); 