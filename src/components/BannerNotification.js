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
  duration = 5000,  // Changed default to 5000ms (5 seconds)
  onHide
}) => {
  // Use translateY animation from top instead of bottom
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  const timerRef = useRef(null);
  
  useEffect(() => {
    console.log('BannerNotification useEffect - visible:', visible, 'message:', message);
    
    // Clear any existing timer to prevent conflicts
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    if (visible && message) {
      console.log('Showing banner with message:', message);
      
      // Show the banner (from top) with opacity fade
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
      
      // Hide after duration
      timerRef.current = setTimeout(() => {
        console.log('Auto-hiding banner after timeout');
        hideNotification();
      }, duration);
    } else {
      // Ensure banner is hidden when visible prop is false
      hideNotification();
    }
    
    // Cleanup timer on unmount or when visible changes
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, message, duration]);
  
  const hideNotification = () => {
    console.log('Hiding notification banner');
    // Hide the banner (to top) with opacity fade
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
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
  
  // Don't render anything if message is empty
  if (!message) {
    return null;
  }
  
  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          transform: [{ translateY }],
          opacity,
          backgroundColor,
          marginTop: insets.top,
        }
      ]}
    >
      <Ionicons name={icon} size={24} color={color} style={styles.icon} />
      <Text style={[styles.message, { color }]}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
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
  icon: {
    marginRight: 8,
  },
  message: {
    fontFamily: typography.fonts.medium,
    fontSize: 16,
    paddingLeft: 4,
    flex: 1,
  }
});

export default BannerNotification; 