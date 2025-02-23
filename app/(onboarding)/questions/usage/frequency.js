import React from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const FrequencyQuestion = () => {
  const { saveAnswer } = useOnboarding();

  const handleAnswer = (answer) => {
    saveAnswer('usage_frequency', answer);
  };

  return (
    <QuestionScreen
      question="How often did you use cannabis?"
      options={[
        "Multiple times per day",
        "Once daily",
        "A few times per week",
        "Occasionally"
      ]}
      onAnswer={handleAnswer}
      currentStep={5}
      totalSteps={7}
      nextRoute="/(onboarding)/analysis/usage"
    />
  );
};

export default FrequencyQuestion; 