import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const QuitQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_quit');
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
    saveAnswer('addiction_quit', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Have you ever tried to quit before?"
      options={[
        { text: "Yes" },
        { text: "No" }
      ]}
      onSelect={handleAnswer}
      currentStep={10}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/money_savings_info"
      questionId="addiction_quit"
    />
  );
};

export default QuitQuestion; 