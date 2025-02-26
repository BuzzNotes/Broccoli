import { Redirect } from 'expo-router';

// Simple redirect to the breathe screen
export default function Index() {
  return <Redirect href="/(intro)/breathe" />;
}
