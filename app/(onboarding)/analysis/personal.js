import React from 'react';
import AnalysisScreen from '../components/AnalysisScreen';
import { useOnboarding } from '../context/OnboardingContext';

const PersonalAnalysis = () => {
  const { answers } = useOnboarding();

  return (
    <AnalysisScreen
      title="Physical Profile Analysis"
      message="Your body type and activity level will influence how quickly THC leaves your system. Active individuals tend to process THC faster due to higher metabolism and fat breakdown."
      nextRoute="/(onboarding)/questions/usage/frequency"
      gradientColors={['rgba(79, 196, 191, 0.4)', '#4FA65B']}
    />
  );
};

export default PersonalAnalysis; 