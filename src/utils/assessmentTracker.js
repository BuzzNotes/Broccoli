import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Keys for AsyncStorage
const USER_ASSESSMENT_KEY = 'userAssessment';

/**
 * Processes and categorizes user assessment answers to determine emotional factors
 * @param {Object} answers - The answers from onboarding questions
 * @returns {Object} Categorized emotional factors with scores
 */
export const processAssessmentAnswers = (answers) => {
  // Define emotional categories
  const emotionalFactors = {
    anxiety: 0,
    depression: 0,
    socialIssues: 0,
    boredom: 0,
    confidence: 0,
    financial: 0,
    withdrawal: 0
  };
  
  // Process anxiety questions
  if (answers.addiction_anxiety && answers.addiction_anxiety.answer) {
    // Higher scores mean more anxiety issues
    emotionalFactors.anxiety += answers.addiction_anxiety.score || 0;
  }
  
  // Process stress questions
  if (answers.addiction_stress && answers.addiction_stress.answer) {
    // Higher scores mean more stress/depression issues
    emotionalFactors.depression += answers.addiction_stress.score || 0;
  }
  
  // Process boredom questions
  if (answers.addiction_boredom && answers.addiction_boredom.answer) {
    emotionalFactors.boredom += answers.addiction_boredom.score || 0;
  }
  
  // Process financial/money questions
  if (answers.addiction_money && answers.addiction_money.answer === "Yes") {
    emotionalFactors.financial += answers.addiction_money.score || 0;
  }
  
  // Process memory questions for confidence
  if (answers.addiction_memory && answers.addiction_memory.answer) {
    emotionalFactors.confidence += answers.addiction_memory.score || 0;
  }
  
  // Calculate overall dependency score
  const calculateDependencyScore = (answers) => {
    // Logic from FinalAnalysis.js
    const addictionKeys = [
      'addiction_frequency',
      'addiction_duration',
      'addiction_increased',
      'addiction_anxiety',
      'addiction_memory',
      'addiction_other_substances',
      'addiction_gender',
      'addiction_stress',
      'addiction_boredom',
      'addiction_money'
    ];
    
    // Maximum possible score is 23
    const maxPossibleScore = 23;
    let totalScore = 0;
    let answeredQuestions = 0;
    
    addictionKeys.forEach(key => {
      if (answers[key] && typeof answers[key].score === 'number') {
        totalScore += answers[key].score;
        answeredQuestions++;
      }
    });
    
    // Default to 50% if no questions answered
    if (answeredQuestions === 0) return 50;
    
    // Return percentage of maximum score
    return Math.round((totalScore / maxPossibleScore) * 100);
  };
  
  // Determine top emotional factors
  const getTopFactors = (factors) => {
    // Convert to array of [key, value] pairs
    const factorArray = Object.entries(factors);
    
    // Sort by score (descending)
    factorArray.sort((a, b) => b[1] - a[1]);
    
    // Return top 3 factors
    return factorArray.slice(0, 3).map(([key, value]) => key);
  };
  
  const dependencyScore = calculateDependencyScore(answers);
  const topEmotionalFactors = getTopFactors(emotionalFactors);
  
  return {
    emotionalFactors,
    dependencyScore,
    topEmotionalFactors
  };
};

/**
 * Saves user assessment data to Firestore and AsyncStorage
 * @param {Object} answers - The answers from onboarding questions
 * @returns {Promise<Object>} The processed assessment data
 */
export const saveUserAssessment = async (answers) => {
  try {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error('User not authenticated');
    
    // Process answers to get dependency scores and emotional factors
    const processedData = processAssessmentAnswers(answers);
    
    // Create assessment data object
    const assessmentData = {
      answers,
      processedData,
      timestamp: new Date().toISOString(),
      lastUpdated: serverTimestamp()
    };
    
    // Save to Firestore
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      assessment: assessmentData,
      dependencyScore: processedData.dependencyScore,
      emotionalFactors: processedData.emotionalFactors,
      topEmotionalFactors: processedData.topEmotionalFactors,
      lastAssessmentDate: serverTimestamp()
    });
    
    // Save to AsyncStorage for offline access
    await AsyncStorage.setItem(USER_ASSESSMENT_KEY, JSON.stringify({
      ...assessmentData,
      lastUpdated: new Date().toISOString()
    }));
    
    return processedData;
  } catch (error) {
    console.error('Error saving user assessment:', error);
    throw error;
  }
};

/**
 * Gets the user's assessment data from Firestore or AsyncStorage
 * @returns {Promise<Object>} The user's assessment data
 */
export const getUserAssessment = async () => {
  try {
    const userId = auth.currentUser?.uid;
    
    // If user is logged in, try to get from Firestore first
    if (userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists() && userDoc.data().assessment) {
          return userDoc.data().assessment;
        }
      } catch (error) {
        console.warn('Error fetching assessment from Firestore:', error);
      }
    }
    
    // Fall back to AsyncStorage
    const storedAssessment = await AsyncStorage.getItem(USER_ASSESSMENT_KEY);
    if (storedAssessment) {
      return JSON.parse(storedAssessment);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user assessment:', error);
    return null;
  }
};

/**
 * Gets personalized content recommendations based on user's assessment
 * @returns {Promise<Object>} Personalized content recommendations
 */
export const getPersonalizedRecommendations = async () => {
  try {
    const assessment = await getUserAssessment();
    if (!assessment || !assessment.processedData) {
      return getDefaultRecommendations();
    }
    
    const { topEmotionalFactors, dependencyScore } = assessment.processedData;
    
    // Content categories based on emotional factors
    const contentMap = {
      anxiety: {
        title: "Anxiety Management",
        description: "Techniques to reduce anxiety without cannabis",
        exercises: ["Deep breathing", "Progressive muscle relaxation", "Mindfulness meditation"],
        resources: ["Understanding Anxiety", "Natural Anxiety Relief"]
      },
      depression: {
        title: "Mood Enhancement",
        description: "Natural ways to boost your mood and energy",
        exercises: ["Daily gratitude practice", "Physical exercise routine", "Nature exposure"],
        resources: ["Beating the Blues Naturally", "Exercise and Mood"]
      },
      socialIssues: {
        title: "Social Confidence",
        description: "Building social skills and confidence without substances",
        exercises: ["Small talk practice", "Setting social boundaries", "Assertiveness training"],
        resources: ["Social Skills Without Substances", "Building Authentic Connections"]
      },
      boredom: {
        title: "Engagement Activities",
        description: "Finding fulfillment and stimulation in daily life",
        exercises: ["New hobby exploration", "Creativity challenges", "Skill development"],
        resources: ["Defeating Boredom", "Finding Your Flow State"]
      },
      confidence: {
        title: "Self-Esteem Building",
        description: "Develop genuine confidence and self-worth",
        exercises: ["Positive affirmations", "Achievement tracking", "Skills mastery"],
        resources: ["Building Self-Confidence", "Overcoming Imposter Syndrome"]
      },
      financial: {
        title: "Financial Wellness",
        description: "Managing money and reducing financial stress",
        exercises: ["Budget creation", "Spending awareness", "Saving strategies"],
        resources: ["Financial Freedom", "Money Management Basics"]
      },
      withdrawal: {
        title: "Managing Withdrawal",
        description: "Techniques to handle cannabis withdrawal symptoms",
        exercises: ["Craving management", "Sleep hygiene", "Stress reduction"],
        resources: ["Understanding Withdrawal", "The Recovery Timeline"]
      }
    };
    
    // Generate recommendations based on top factors
    const recommendations = topEmotionalFactors.map(factor => contentMap[factor] || null)
      .filter(item => item !== null);
    
    // Add general recommendations based on dependency score
    if (dependencyScore >= 70) {
      recommendations.push({
        title: "High Dependency Support",
        description: "Intensive strategies for heavy cannabis users",
        exercises: ["Structured day planning", "Trigger identification", "Professional support"],
        resources: ["Breaking Strong Habits", "When to Seek Help"]
      });
    }
    
    return recommendations.length > 0 ? recommendations : getDefaultRecommendations();
  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return getDefaultRecommendations();
  }
};

/**
 * Provides default recommendations when no assessment data is available
 * @returns {Array} Default content recommendations
 */
const getDefaultRecommendations = () => {
  return [
    {
      title: "Getting Started",
      description: "Beginning your cannabis-free journey",
      exercises: ["Setting your intention", "Creating a support system", "Identifying triggers"],
      resources: ["First Steps to Quitting", "Building Your Support Network"]
    },
    {
      title: "General Wellness",
      description: "Overall strategies for a healthy lifestyle",
      exercises: ["Daily exercise", "Proper nutrition", "Sleep optimization"],
      resources: ["Holistic Health Basics", "Natural Dopamine Boosters"]
    }
  ];
}; 