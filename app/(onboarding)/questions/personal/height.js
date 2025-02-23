import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const HeightQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('height');
  }, []);

  const handleAnswer = (answer) => {
    saveAnswer('height', answer);
  };

  return (
    <QuestionScreen
      question="What is your height?"
      options={[
        "Under 5'5\"",
        "5'5\" - 5'9\"",
        "5'10\" - 6'2\"",
        "Over 6'2\""
      ]}
      onAnswer={handleAnswer}
      currentStep={2}
      totalSteps={7}
      nextRoute="/(onboarding)/questions/personal/weight"
    />
  );
};

export default HeightQuestion; 