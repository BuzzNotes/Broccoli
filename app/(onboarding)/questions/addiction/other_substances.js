import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const OtherSubstancesQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_other_substances');
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
    saveAnswer('addiction_other_substances', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Do you use other substances (alcohol, tobacco, etc.) along with cannabis?"
      options={[
        { text: "Yes" },
        { text: "No" }
      ]}
      onSelect={handleAnswer}
      currentStep={9}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/gender"
      questionId="addiction_other_substances"
    />
  );
};

export default OtherSubstancesQuestion; 