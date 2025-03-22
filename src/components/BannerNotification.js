import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { typography } from '../../app/styles/typography';

const { width } = Dimensions.get('window');

const BannerNotification = ({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000,
  onHide
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    if (visible) {
      // Show the banner
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 50,
      }).start();
      
      // Hide after duration
      const timer = setTimeout(() => {
        hideNotification();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [visible]);
  
  const hideNotification = () => {
    // Hide the banner
    Animated.timing(translateY, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (onHide) onHide();
    });
  };
  
  // Define icon and colors based on notification type
  const getNotificationStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          backgroundColor: '#5BBD68',
          color: '#FFFFFF'
        };
      case 'error':
        return {
          icon: 'alert-circle',
          backgroundColor: '#F44336',
          color: '#FFFFFF'
        };
      case 'info':
        return {
          icon: 'information-circle',
          backgroundColor: '#3498DB',
          color: '#FFFFFF'
        };
      default:
        return {
          icon: 'checkmark-circle',
          backgroundColor: '#5BBD68',
          color: '#FFFFFF'
        };
    }
  };
  
  const { icon, backgroundColor, color } = getNotificationStyles();
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { transform: [{ translateY }], backgroundColor, marginTop: insets.top }
      ]}
    >
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.message, { color }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    width: width,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  message: {
    fontFamily: typography.fonts.medium,
    fontSize: 16,
    paddingLeft: 12,
    flex: 1,
  }
});

export default BannerNotification; 