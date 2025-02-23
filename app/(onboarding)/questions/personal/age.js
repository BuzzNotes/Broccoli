import React from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const AgeQuestion = () => {
  const { saveAnswer } = useOnboarding();

  const handleAnswer = (answer) => {
    saveAnswer('age', answer);
  };

  return (
    <QuestionScreen
      question="What is your age?"
      options={[
        "Under 18",
        "18-24",
        "25-34",
        "35+"
      ]}
      onAnswer={handleAnswer}
      currentStep={1}
      totalSteps={7}
      nextRoute="/(onboarding)/questions/personal/height"
    />
  );
};

export default AgeQuestion; 