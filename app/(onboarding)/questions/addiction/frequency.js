import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const FrequencyQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_frequency');
  }, []);

  const handleAnswer = (answer) => {
    let score = 1; // Default score
    
    // Assign score based on answer
    if (answer === "A few times a month") {
      score = 1;
    } else if (answer === "A few times a week") {
      score = 2;
    } else if (answer === "Daily") {
      score = 3;
    } else if (answer === "Multiple times a day") {
      score = 4;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_frequency', {
      answer: answer,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="How often do you smoke weed?"
      options={[
        "A few times a month",
        "A few times a week",
        "Daily",
        "Multiple times a day"
      ]}
      onAnswer={handleAnswer}
      currentStep={1}
      totalSteps={10}
      nextRoute="/(onboarding)/questions/addiction/duration"
    />
  );
};

export default FrequencyQuestion; 