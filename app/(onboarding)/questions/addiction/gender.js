import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const GenderQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_gender');
  }, []);

  const handleAnswer = (answer) => {
    // All gender options have a score of 0 as specified
    const score = 0;
    
    // Save both the answer and the score
    saveAnswer('addiction_gender', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="What is your gender?"
      options={[
        "Male",
        "Female",
        "Non-binary"
      ]}
      onAnswer={handleAnswer}
      currentStep={7}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/stress"
    />
  );
};

export default GenderQuestion; 