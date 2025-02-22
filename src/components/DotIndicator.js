import React from 'react';
import { View, StyleSheet } from 'react-native';

const DotIndicator = ({ currentIndex, totalDots }) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: totalDots }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            { opacity: currentIndex === index ? 1 : 0.5 },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    margin: 5,
  },
});

export default DotIndicator; 