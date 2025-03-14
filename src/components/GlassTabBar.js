import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from '../../app/styles/colors';
import { LinearGradient } from 'expo-linear-gradient';

const GlassTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={styles.outerContainer}>
      {/* Solid background to prevent content from showing through */}
      <View style={styles.solidBackground} />
      
      {/* Subtle top border */}
      <View style={styles.topBorder} />
      
      <View style={styles.container}>
        {/* White background */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.whiteBackground} />
        </View>
        
        <View style={styles.tabBar}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            const getIconName = () => {
              const routeName = route.name;
              if (routeName === 'index') {
                return isFocused ? 'time' : 'time-outline';
              } else if (routeName === 'recovery') {
                return isFocused ? 'heart' : 'heart-outline';
              } else if (routeName === 'community') {
                return isFocused ? 'people' : 'people-outline';
              } else if (routeName === 'profile') {
                return isFocused ? 'person' : 'person-outline';
              }
              return 'help-circle';
            };

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <TouchableOpacity
                key={index}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                style={styles.tabButton}
              >
                <View style={[
                  styles.iconContainer,
                  isFocused && styles.activeIconContainer
                ]}>
                  {isFocused && (
                    <View style={styles.activeBackground} />
                  )}
                  <Ionicons
                    name={getIconName()}
                    size={24}
                    color={isFocused ? '#4CAF50' : '#AAAAAA'}
                    style={isFocused && styles.activeIcon}
                  />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 1000, // Ensure navbar is above all other content
  },
  solidBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 80, // Make sure it's tall enough
    backgroundColor: '#FFFFFF', // White background
  },
  topBorder: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // Subtle gray border
  },
  container: {
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: 'rgba(0, 0, 0, 0.1)',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  whiteBackground: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  tabBar: {
    flexDirection: 'row',
    height: Platform.OS === 'ios' ? 88 : 60,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeIconContainer: {
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  activeBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  activeIcon: {
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});

export default GlassTabBar; 