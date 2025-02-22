import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../styles/colors';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = () => {
  const handleLogout = async () => {
    // Clear any stored data
    try {
      await AsyncStorage.clear();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const MenuItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={24} color={colors.text.primary} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={24} color={colors.text.secondary} />
      )}
    </Pressable>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.profileImage}>
          <Ionicons name="person" size={40} color={colors.text.primary} />
        </View>
        <Text style={styles.name}>John Doe</Text>
        <Text style={styles.streak}>7 Days Clean</Text>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <MenuItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Name, photo, personal details"
          onPress={() => {}}
        />
        <MenuItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Reminders, alerts, messages"
          onPress={() => {}}
        />
        <MenuItem
          icon="lock-closed-outline"
          title="Privacy"
          subtitle="Password, security settings"
          onPress={() => {}}
        />
      </View>

      {/* Preferences Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <MenuItem
          icon="color-palette-outline"
          title="Appearance"
          subtitle="Theme, colors, display"
          onPress={() => {}}
        />
        <MenuItem
          icon="language-outline"
          title="Language"
          subtitle="English (US)"
          onPress={() => {}}
        />
      </View>

      {/* Support Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        <MenuItem
          icon="help-circle-outline"
          title="Help Center"
          onPress={() => {}}
        />
        <MenuItem
          icon="information-circle-outline"
          title="About"
          subtitle="Version 1.0.0"
          onPress={() => {}}
        />
      </View>

      {/* Logout Button */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color="#FF4B4B" />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.dark,
    paddingTop: 34,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  streak: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginBottom: 8,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
    marginLeft: 12,
  },
  menuTitle: {
    fontSize: 16,
    color: colors.text.primary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginVertical: 24,
    marginHorizontal: 16,
    backgroundColor: 'rgba(255,75,75,0.1)',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#FF4B4B',
    marginLeft: 8,
  },
});

export default ProfileScreen; 