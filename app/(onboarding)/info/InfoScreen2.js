import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { router } from 'expo-router';
import CustomButton from "../../../src/components/CustomButton";
import icon from '../../../assets/images/icon.png';

const InfoScreen2 = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Impact of Dependence</Text>
      <Image source={icon} style={styles.image} />
      <Text style={styles.infoText}>
        Dependence on cannabis can affect your daily life, relationships, and mental health.
      </Text>
      <CustomButton
        title="Next"
        onPress={() => router.push('/(onboarding)/info/InfoScreen3')}
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

export default InfoScreen2; 