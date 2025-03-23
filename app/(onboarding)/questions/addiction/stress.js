import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const StressQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_stress');
  }, []);

  const handleAnswer = (option) => {
    let score = 0;
    
    // Assign score based on answer
    if (option.text === "Never") {
      score = 0;
    } else if (option.text === "Rarely") {
      score = 1;
    } else if (option.text === "Sometimes") {
      score = 2;
    } else if (option.text === "Often") {
      score = 3;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_stress', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="Do you use weed to cope with stress?"
      options={[
        { text: "Never" },
        { text: "Rarely" },
        { text: "Sometimes" },
        { text: "Often" }
      ]}
      onSelect={handleAnswer}
      currentStep={7}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/memory"
      questionId="addiction_stress"
    />
  );
};

export default StressQuestion; 