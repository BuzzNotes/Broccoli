import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RecoveryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recovery Page</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans-Bold',
  },
});

export default RecoveryScreen; 