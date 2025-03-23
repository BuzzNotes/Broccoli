import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const IncreasedQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_increased');
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
    saveAnswer('addiction_increased', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Have you noticed an increase in how often you need to smoke to feel the same effect?"
      options={[
        { text: "Yes" },
        { text: "No" }
      ]}
      onSelect={handleAnswer}
      currentStep={3}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/money"
      questionId="addiction_increased"
    />
  );
};

export default IncreasedQuestion; 