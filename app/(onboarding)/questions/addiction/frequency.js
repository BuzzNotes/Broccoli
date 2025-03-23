import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const FrequencyQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_frequency');
  }, []);

  const handleAnswer = (option) => {
    let score = 1; // Default score
    
    // Assign score based on answer
    if (option.text === "A few times a month") {
      score = 1;
    } else if (option.text === "A few times a week") {
      score = 2;
    } else if (option.text === "Daily") {
      score = 3;
    } else if (option.text === "Multiple times a day") {
      score = 4;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_frequency', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="How often do you smoke weed?"
      options={[
        { text: "A few times a month" },
        { text: "A few times a week" },
        { text: "Daily" },
        { text: "Multiple times a day" }
      ]}
      onSelect={handleAnswer}
      currentStep={1}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/duration"
      questionId="addiction_frequency"
    />
  );
};

export default FrequencyQuestion; 