import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../context/OnboardingContext';
import * as Haptics from 'expo-haptics';
import { useFonts, PlusJakartaSans_700Bold, PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans";
import LoadingScreen from '../../../../src/components/LoadingScreen';
import { auth, db } from '../../../../src/config/firebase';
import { updateDoc, doc } from 'firebase/firestore';

const WeedCostQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState(null);
  const [isButtonEnabled, setIsButtonEnabled] = useState(false);

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
  });

  useEffect(() => {
    clearAnswer('weed_cost');
  }, []);

  // Enable/disable button based on both amount and frequency being set
  useEffect(() => {
    setIsButtonEnabled(amount.trim().length > 0 && frequency !== null);
  }, [amount, frequency]);

  const handleFrequencySelect = (selectedFrequency) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFrequency(selectedFrequency);
  };

  const handleNext = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Calculate annual cost
    const numAmount = parseFloat(amount);
    let annualCost = 0;
    
    switch (frequency) {
      case 'daily':
        annualCost = numAmount * 365;
        break;
      case 'weekly':
        annualCost = numAmount * 52;
        break;
      case 'monthly':
        annualCost = numAmount * 12;
        break;
    }
    
    // Save both the answer and the calculated annual cost
    saveAnswer('weed_cost', {
      amount: numAmount,
      frequency: frequency,
      annual_cost: annualCost
    });
    
    // Also save to Firestore if authenticated
    try {
      if (auth.currentUser) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
          weed_cost: {
            amount: numAmount,
            frequency: frequency,
            annual_cost: annualCost
          }
        });
        console.log('Saved weed cost to Firestore');
      }
    } catch (error) {
      console.error('Error saving weed cost to Firestore:', error);
    }
    
    router.push('/(onboarding)/analysis/final');
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

      <ScrollView>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <View style={styles.questionContainer}>
            <View style={styles.questionWrapper}>
              <Text style={styles.question}>How much money do you spend on weed at a time?</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#666"
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              </View>

              <Text style={styles.subQuestion}>How frequently do you buy?</Text>
              
              <View style={styles.frequencyContainer}>
                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'daily' && styles.selectedFrequency
                  ]}
                  onPress={() => handleFrequencySelect('daily')}
                >
                  <Text style={[
                    styles.frequencyText,
                    frequency === 'daily' && styles.selectedFrequencyText
                  ]}>Daily</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'weekly' && styles.selectedFrequency
                  ]}
                  onPress={() => handleFrequencySelect('weekly')}
                >
                  <Text style={[
                    styles.frequencyText,
                    frequency === 'weekly' && styles.selectedFrequencyText
                  ]}>Weekly</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.frequencyButton,
                    frequency === 'monthly' && styles.selectedFrequency
                  ]}
                  onPress={() => handleFrequencySelect('monthly')}
                >
                  <Text style={[
                    styles.frequencyText,
                    frequency === 'monthly' && styles.selectedFrequencyText
                  ]}>Monthly</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      {/* Disclaimer */}
      <View style={styles.disclaimerContainer}>
        <View style={styles.disclaimerBox}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" style={styles.disclaimerIcon} />
          <Text style={styles.disclaimerText}>
            We do not share this information with anyone. We only use it to predict your estimated savings.
          </Text>
        </View>
      </View>

      {/* Next Button - Fixed at bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !isButtonEnabled && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!isButtonEnabled}
        >
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  questionContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 120,
  },
  questionWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  question: {
    fontSize: 24,
    color: '#333',
    marginBottom: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  currencySymbol: {
    fontSize: 24,
    color: '#333',
    marginRight: 8,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  input: {
    flex: 1,
    fontSize: 24,
    color: '#333',
    paddingVertical: 16,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  subQuestion: {
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
  },
  frequencyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  frequencyButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedFrequency: {
    backgroundColor: '#4CAF50',
  },
  frequencyText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  selectedFrequencyText: {
    color: '#FFFFFF',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#A0A0A0',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  disclaimerContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    padding: 16,
  },
  disclaimerIcon: {
    marginRight: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 14,
    color: '#4CAF50',
    fontFamily: 'PlusJakartaSans-Regular',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
  },
});

export default WeedCostQuestion; 