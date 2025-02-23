import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const WeightQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('weight');
  }, []);

  const handleAnswer = (answer) => {
    saveAnswer('weight', answer);
  };

  return (
    <QuestionScreen
      question="What is your weight range?"
      options={[
        "Underweight",
        "Average weight",
        "Overweight",
        "Obese"
      ]}
      onAnswer={handleAnswer}
      currentStep={3}
      totalSteps={7}
      nextRoute="/(onboarding)/questions/personal/activity"
    />
  );
};

export default WeightQuestion; 