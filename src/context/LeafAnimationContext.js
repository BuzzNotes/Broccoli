import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

// Create the context
const LeafAnimationContext = createContext();

// Custom hook to use the leaf animation context
export const useLeafAnimation = () => {
  const context = useContext(LeafAnimationContext);
  if (!context) {
    throw new Error('useLeafAnimation must be used within a LeafAnimationProvider');
  }
  return context;
};

// Provider component
export const LeafAnimationProvider = ({ children }) => {
  // State to track if the animation is active
  const [isAnimating, setIsAnimating] = useState(true);
  
  // State to track the density of leaves
  const [density, setDensity] = useState('normal');
  
  // Ref to track the previous density for transitions
  const prevDensityRef = useRef('normal');
  
  // State to track if we're in a transition
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track when density changes to handle transitions
  useEffect(() => {
    if (prevDensityRef.current !== density) {
      setIsTransitioning(true);
      
      // After a short delay, mark transition as complete
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 500); // 500ms transition time
      
      prevDensityRef.current = density;
      return () => clearTimeout(timer);
    }
  }, [density]);
  
  // Function to start the animation - use useCallback to memoize
  const startAnimation = useCallback(() => {
    setIsAnimating(true);
  }, []);
  
  // Function to stop the animation - use useCallback to memoize
  const stopAnimation = useCallback(() => {
    setIsAnimating(false);
  }, []);
  
  // Function to change the density of leaves - use useCallback to memoize
  const changeDensity = useCallback((newDensity) => {
    if (['none', 'sparse', 'normal', 'dense'].includes(newDensity)) {
      // Only update if different to avoid unnecessary re-renders
      if (density !== newDensity) {
        setDensity(newDensity);
      }
    } else {
      console.warn(`Invalid leaf density: ${newDensity}. Must be one of: none, sparse, normal, dense`);
    }
  }, [density]);
  
  // Memoize the context value to prevent unnecessary re-renders
  const value = React.useMemo(() => ({
    isAnimating,
    density,
    isTransitioning,
    startAnimation,
    stopAnimation,
    changeDensity,
  }), [isAnimating, density, isTransitioning, startAnimation, stopAnimation, changeDensity]);
  
  return (
    <LeafAnimationContext.Provider value={value}>
      {children}
    </LeafAnimationContext.Provider>
  );
}; 