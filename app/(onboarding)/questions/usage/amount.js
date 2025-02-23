import React from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const AmountQuestion = () => {
  const { saveAnswer } = useOnboarding();

  const handleAnswer = (answer) => {
    saveAnswer('usage_amount', answer);
  };

  return (
    <QuestionScreen
      question="How much did you typically use per session?"
      options={[
        "Less than 0.5g",
        "0.5g - 1g",
        "1g - 2g",
        "More than 2g"
      ]}
      onAnswer={handleAnswer}
      currentStep={6}
      totalSteps={7}
      nextRoute="/(onboarding)/questions/usage/method"
    />
  );
};

export default AmountQuestion; 