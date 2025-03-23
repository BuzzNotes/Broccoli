import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const MoneyQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_money');
  }, []);

  const handleAnswer = (option) => {
    let score = 0;
    
    // Assign score based on answer
    if (option.text === "Yes") {
      score = 1;
    } else if (option.text === "No") {
      score = 0;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_money', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Have you ever spent more money on weed than you intended?"
      options={[
        { text: "Yes" },
        { text: "No" }
      ]}
      onSelect={handleAnswer}
      currentStep={4}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/anxiety"
      questionId="addiction_money"
    />
  );
};

export default MoneyQuestion; 