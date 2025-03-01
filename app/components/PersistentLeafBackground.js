import React, { useEffect, useRef, useState, useCallback } from 'react';
import { StyleSheet, View, AppState } from 'react-native';
import LeafBackground from './LeafBackground';
import { useLeafAnimation } from '../../src/context/LeafAnimationContext';

/**
 * A component that renders a persistent leaf background
 * This component should be placed at the root level of the app
 * to ensure the leaf animation persists across screen transitions
 */
const PersistentLeafBackground = () => {
  const { density, isAnimating, startAnimation } = useLeafAnimation();
  const prevDensityRef = useRef(density);
  const appState = useRef(AppState.currentState);
  const [appActive, setAppActive] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const transitionTimerRef = useRef(null);
  
  // Handle transitions between density changes
  useEffect(() => {
    if (prevDensityRef.current !== density) {
      // Mark that we're in a transition
      setIsTransitioning(true);
      
      // Clear any existing transition timer
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      
      // Set a timer to mark the end of the transition
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        transitionTimerRef.current = null;
      }, 1000); // Allow 1 second for transition to complete
      
      // Update the previous density ref
      prevDensityRef.current = density;
    }
    
    return () => {
      // Clean up the transition timer if component unmounts
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
    };
  }, [density]);
  
  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground
        setAppActive(true);
        startAnimation();
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background
        setAppActive(false);
      }
      
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [startAnimation]);
  
  // Ensure animation continues during transitions
  useEffect(() => {
    // If animation was stopped for any reason and app is active, restart it
    if (!isAnimating && appActive && !isTransitioning) {
      startAnimation();
    }
  }, [density, isAnimating, appActive, startAnimation, isTransitioning]);
  
  // Memoize the LeafBackground component to prevent unnecessary re-renders
  const leafBackground = React.useMemo(() => {
    return <LeafBackground customDensity={density} />;
  }, [density]);
  
  return (
    <View 
      style={[
        styles.container,
        isTransitioning && styles.transitioning
      ]} 
      pointerEvents="none"
    >
      {leafBackground}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1, // Above background gradient but below content
  },
  transitioning: {
    // Add any transition styles if needed
  }
});

export default PersistentLeafBackground; 