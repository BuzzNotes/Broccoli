import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const DurationQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_duration');
  }, []);

  const handleAnswer = (answer) => {
    let score = 1; // Default score
    
    // Assign score based on answer
    if (answer === "Less than 6 months") {
      score = 1;
    } else if (answer === "6 months – 2 years") {
      score = 2;
    } else if (answer === "2–5 years") {
      score = 3;
    } else if (answer === "5+ years") {
      score = 4;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_duration', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="How long have you been using?"
      options={[
        "Less than 6 months",
        "6 months – 2 years",
        "2–5 years",
        "5+ years"
      ]}
      onAnswer={handleAnswer}
      currentStep={2}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/increased"
    />
  );
};

export default DurationQuestion; 