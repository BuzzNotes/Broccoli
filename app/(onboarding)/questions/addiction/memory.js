import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const MemoryQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_memory');
  }, []);

  const handleAnswer = (answer) => {
    let score = 1; // Default score
    
    // Assign score based on answer
    if (answer === "Frequently") {
      score = 3;
    } else if (answer === "Occasionally") {
      score = 2;
    } else if (answer === "Rarely or never") {
      score = 1;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_memory', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Have you noticed memory issues or difficulty focusing?"
      options={[
        "Frequently",
        "Occasionally",
        "Rarely or never"
      ]}
      onAnswer={handleAnswer}
      currentStep={5}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/other_substances"
    />
  );
};

export default MemoryQuestion; 