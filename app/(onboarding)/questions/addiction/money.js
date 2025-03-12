import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const MoneyQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_money');
  }, []);

  const handleAnswer = (answer) => {
    let score = 0; // Default score
    
    // Assign score based on answer
    if (answer === "Yes") {
      score = 1;
    } else if (answer === "No") {
      score = 0;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_money', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Have you ever spent money on cannabis that was meant for something more important?"
      options={[
        "Yes",
        "No"
      ]}
      onAnswer={handleAnswer}
      currentStep={10}
      totalSteps={10}
      nextRoute="/(onboarding)/analysis/final"
    />
  );
};

export default MoneyQuestion; 