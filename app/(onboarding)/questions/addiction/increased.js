import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const IncreasedQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_increased');
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
    saveAnswer('addiction_increased', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Has your frequency of use increased since you started?"
      options={[
        "Yes",
        "No"
      ]}
      onAnswer={handleAnswer}
      currentStep={3}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/anxiety"
    />
  );
};

export default IncreasedQuestion; 