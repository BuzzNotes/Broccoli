import React from 'react';
import AnalysisScreen from '../components/AnalysisScreen';
import { useOnboarding } from '../context/OnboardingContext';

const UsageAnalysis = () => {
  const { answers } = useOnboarding();

  return (
    <AnalysisScreen
      title="Usage Pattern Analysis"
      message="Your cannabis usage pattern will help us determine the best recovery timeline and milestones for you. More frequent use typically means a longer recovery period, but don't worry - we'll help you through every step."
      nextRoute="/(onboarding)/questions/usage/amount"
      previousQuestionId="usage_frequency"
      gradientColors={['#7CD7FF', '#4FA65B']}
    />
  );
};

export default UsageAnalysis; 