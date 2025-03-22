import { Redirect } from 'expo-router';

// Redirect to the breathe screen
export default function Index() {
  return <Redirect href="/(intro)/breathe" />;
}
