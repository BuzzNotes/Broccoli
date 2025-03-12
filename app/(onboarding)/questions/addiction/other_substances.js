import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const OtherSubstancesQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_other_substances');
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
    saveAnswer('addiction_other_substances', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Do you think weed has led you to trying other substances?"
      options={[
        "Yes",
        "No"
      ]}
      onAnswer={handleAnswer}
      currentStep={6}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/gender"
    />
  );
};

export default OtherSubstancesQuestion; 