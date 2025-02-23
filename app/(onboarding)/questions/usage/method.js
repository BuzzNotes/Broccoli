import React from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const MethodQuestion = () => {
  const { saveAnswer } = useOnboarding();

  const handleAnswer = (answer) => {
    saveAnswer('usage_method', answer);
  };

  return (
    <QuestionScreen
      question="What was your primary method of consumption?"
      options={[
        "Smoking (joints/pipes)",
        "Vaporizing",
        "Edibles",
        "Multiple methods"
      ]}
      onAnswer={handleAnswer}
      currentStep={7}
      totalSteps={7}
      nextRoute="/(onboarding)/analysis/final"
    />
  );
};

export default MethodQuestion; 