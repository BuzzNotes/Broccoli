import React, { useEffect } from 'react';
import QuestionScreen from '../../components/QuestionScreen';
import { useOnboarding } from '../../context/OnboardingContext';

const GenderQuestion = () => {
  const { saveAnswer, clearAnswer } = useOnboarding();

  useEffect(() => {
    clearAnswer('gender');
  }, []);

  const handleAnswer = (option) => {
    // Save the answer
    saveAnswer('gender', {
      answer: option.text
    });
  };

  return (
    <QuestionScreen
      question="What gender do you identify as?"
      options={[
        { text: "Male" },
        { text: "Female" },
        { text: "Non-binary" },
        { text: "Prefer not to say" }
      ]}
      onSelect={handleAnswer}
      currentStep={10}
      totalSteps={10}
      nextScreen="/(onboarding)/analysis/final"
      questionId="gender"
    />
  );
};

export default GenderQuestion; 