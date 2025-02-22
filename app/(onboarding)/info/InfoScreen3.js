import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import CustomButton from "../../../src/components/CustomButton";
import icon from '../../../assets/images/icon.png';

const InfoScreen3 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next Steps</Text>
      <Image source={icon} style={styles.image} />
      <Text style={styles.infoText}>
        Consider seeking support or resources to help manage your dependence.
      </Text>
      <CustomButton
        title="Continue"
        onPress={() => router.push('/(onboarding)/autoTransition')}
        backgroundColor="#4285F4"
        textColor="#FFF"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 40,
  },
});

export default InfoScreen3; 