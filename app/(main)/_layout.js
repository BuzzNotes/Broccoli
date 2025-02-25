import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import GlassTabBar from '../../src/components/GlassTabBar';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: 'none', // Hide the default tab bar
        },
      }}
      tabBar={(props) => <GlassTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
        }}
      />
      <Tabs.Screen
        name="recovery"
        options={{
          title: 'Recovery',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: 'Community',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
} 