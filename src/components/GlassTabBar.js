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
      
      {/* Gradient border at the top */}
      <LinearGradient
        colors={['rgb(209, 97, 200)', 'rgba(196, 199, 27, 0.91)', 'rgb(79, 166, 91)', 'rgb(28, 183, 204)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientBorder}
      />
      
      <View style={styles.container}>
        {/* Solid background gradient */}
        <LinearGradient
          colors={['rgb(31, 31, 31)', 'rgb(7, 17, 12)']}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
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
                    <LinearGradient
                      colors={['rgba(79, 166, 91, 0.3)', 'rgba(79, 166, 91, 0.1)']}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={25}
                    />
                  )}
                  <Ionicons
                    name={getIconName()}
                    size={24}
                    color={isFocused ? '#4FA65B' : colors.text.secondary}
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
    backgroundColor: '#000000', // Solid black background to prevent transparency
  },
  gradientBorder: {
    height: 1,
    width: '100%',
  },
  container: {
    // Removed border radius
    overflow: 'hidden',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(79, 166, 91, 0.2)',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderLeftColor: 'rgba(79, 166, 91, 0.1)',
    borderRightColor: 'rgba(79, 166, 91, 0.1)',
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 10,
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
    borderColor: 'rgba(79, 166, 91, 0.3)',
    backgroundColor: 'rgba(15, 26, 21, 0.7)',
  },
  activeIcon: {
    shadowColor: '#4FA65B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
});

export default GlassTabBar; 