import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, Dimensions, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans";
import LoadingScreen from '../../../../src/components/LoadingScreen';

const { width } = Dimensions.get('window');

const MoneySavingsInfo = () => {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
  });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(onboarding)/questions/addiction/weed_cost');
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  if (!fontsLoaded) return <LoadingScreen />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
      
      {/* Green gradient background */}
      <View style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={['#FFFFFF', '#E8F5E9', '#C8E6C9']}
          style={{flex: 1}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
        />
      </View>

      {/* Back Button */}
      <TouchableOpacity onPress={handleBack} style={styles.backButton}>
        <Ionicons name="chevron-back" size={28} color="#4CAF50" />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>See Your Savings</Text>
            <Text style={styles.subtitle}>Let us show you how much you'll save by quitting</Text>
          </View>

          {/* Savings Graph */}
          <View style={styles.graphContainer}>
            <View style={styles.graphBar}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={[styles.graphFill, { height: '20%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.graphLabel}>1 Month</Text>
            </View>
            <View style={styles.graphBar}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={[styles.graphFill, { height: '40%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.graphLabel}>3 Months</Text>
            </View>
            <View style={styles.graphBar}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={[styles.graphFill, { height: '60%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.graphLabel}>6 Months</Text>
            </View>
            <View style={styles.graphBar}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={[styles.graphFill, { height: '80%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.graphLabel}>9 Months</Text>
            </View>
            <View style={styles.graphBar}>
              <LinearGradient
                colors={['#4CAF50', '#388E3C']}
                style={[styles.graphFill, { height: '100%' }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
              />
              <Text style={styles.graphLabel}>1 Year</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View style={styles.infoContainer}>
            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="wallet-outline" size={24} color="#4CAF50" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Track Your Savings</Text>
                <Text style={styles.infoDescription}>
                  Monitor your progress and see how much money you're saving each day
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="trending-up-outline" size={24} color="#4CAF50" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Set Financial Goals</Text>
                <Text style={styles.infoDescription}>
                  Use your savings to invest in your future or treat yourself to something special
                </Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <View style={styles.infoIconContainer}>
                <Ionicons name="heart-outline" size={24} color="#4CAF50" />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Stay Motivated</Text>
                <Text style={styles.infoDescription}>
                  Visualize your progress and celebrate your financial milestones
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Next Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  headerContainer: {
    marginTop: 80,
    marginBottom: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    color: '#333',
    marginBottom: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
    textAlign: 'center',
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  graphBar: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  graphFill: {
    width: '100%',
    borderRadius: 8,
    marginBottom: 8,
  },
  graphLabel: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
  },
  infoContainer: {
    flex: 1,
    gap: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  infoDescription: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default MoneySavingsInfo; 