import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const ActivityQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('activity');
  }, []);

  const handleAnswer = (answer) => {
    saveAnswer('activity', answer);
  };

  return (
    <QuestionScreen
      question="What's your activity level?"
      options={[
        "Very active (regular exercise)",
        "Moderately active (some exercise)",
        "Lightly active (occasional walks)",
        "Mostly sedentary"
      ]}
      onAnswer={handleAnswer}
      currentStep={4}
      totalSteps={7}
      nextRoute="/(onboarding)/analysis/personal"
    />
  );
};

export default ActivityQuestion; 