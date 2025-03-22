import { Stack } from 'expo-router';

export default function StandaloneLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="post-detail" />
      <Stack.Screen name="create-post" />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="user-profile" />
      <Stack.Screen name="journal-entry" />
      <Stack.Screen name="journal-list" />
    </Stack>
  );
} 