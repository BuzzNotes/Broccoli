import React, { createContext, useContext, useState } from 'react';

const OnboardingContext = createContext();

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

export const OnboardingProvider = ({ children }) => {
  const [answers, setAnswers] = useState({});

  const saveAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const clearAnswer = (questionId) => {
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[questionId];
      return newAnswers;
    });
  };

  const getAnswer = (questionId) => {
    return answers[questionId];
  };

  return (
    <OnboardingContext.Provider value={{ 
      answers, 
      saveAnswer, 
      clearAnswer,
      getAnswer
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}; 