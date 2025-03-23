import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const DurationQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('addiction_duration');
  }, []);

  const handleAnswer = (option) => {
    let score = 1; // Default score
    
    // Assign score based on answer
    if (option.text === "Less than 6 months") {
      score = 1;
    } else if (option.text === "6 months – 2 years") {
      score = 2;
    } else if (option.text === "2–5 years") {
      score = 3;
    } else if (option.text === "5+ years") {
      score = 4;
    }
    
    // Save both the answer and the score
    saveAnswer('addiction_duration', {
      answer: option.text,
      score: score
    });
  };

  return (
    <QuestionScreen
      question="How long have you been using?"
      options={[
        { text: "Less than 6 months" },
        { text: "6 months – 2 years" },
        { text: "2–5 years" },
        { text: "5+ years" }
      ]}
      onSelect={handleAnswer}
      currentStep={2}
      totalSteps={10}
      nextScreen="/(onboarding)/questions/addiction/increased"
      questionId="addiction_duration"
    />
  );
};

export default DurationQuestion; 