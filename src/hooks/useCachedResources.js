import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

export default function useCachedResources() {
  const [isLoadingComplete, setLoadingComplete] = useState(false);

  // Load any resources or data that we need prior to rendering the app
  useEffect(() => {
    async function loadResourcesAndDataAsync() {
      try {
        SplashScreen.preventAutoHideAsync();

        // Load fonts
        await Font.loadAsync({
          'SF-Pro-Rounded-Bold': require('../../assets/fonts/SF-Pro-Rounded-Bold.otf'),
          'SF-Pro-Rounded-Semibold': require('../../assets/fonts/SF-Pro-Rounded-Semibold.otf'),
          'SF-Pro-Rounded-Medium': require('../../assets/fonts/SF-Pro-Rounded-Medium.otf'),
          'SF-Pro-Rounded-Regular': require('../../assets/fonts/SF-Pro-Rounded-Regular.otf'),
          'SF-Pro-Rounded-Light': require('../../assets/fonts/SF-Pro-Rounded-Light.otf'),
        });
      } catch (e) {
        // We might want to provide this error information to an error reporting service
        console.warn(e);
      } finally {
        setLoadingComplete(true);
        SplashScreen.hideAsync();
      }
    }

    loadResourcesAndDataAsync();
  }, []);

  return isLoadingComplete;
} 