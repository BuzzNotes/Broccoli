// List of offensive terms, slurs, and inappropriate content patterns
// This is a basic implementation - consider using a more comprehensive library or service in production
const OFFENSIVE_TERMS = [
  // Racial slurs
  'n word', 'n-word', 'nigga','nigger', 'negro', 'chink', 'wetback', 'spic', 'kike', 'gook', 'towelhead', 'n1g', 'n!g',
  // Common offensive/bullying terms
  'retard', 'faggot', 'fag', 'dyke', 'tranny', 
  // Profanity (worst ones)
  'cunt', 'cock', 'pussy', 'asshole', 'whore', 'slut',
  // Threatening language
  'kill yourself', 'kys', 'kill urself', 'go die', 'neck yourself'
];

/**
 * Creates a regex pattern that catches variations of offensive words
 * This handles common obfuscation attempts (zero for o, dollar sign for s, etc)
 * @param {string} term - The offensive term to create pattern for
 * @returns {RegExp} Regex pattern that catches variations
 */
const createObfuscationPattern = (term) => {
  const charMap = {
    'a': '[a@4]+',
    'b': '[b8]+',
    'c': '[c(]+',
    'e': '[e3]+',
    'i': '[i!1]+',
    'l': '[l1]+',
    'o': '[o0]+',
    's': '[s$5]+',
    't': '[t7]+',
    'u': '[u\u03bc]+', // includes micro symbol
  };

  let pattern = '';
  for (const char of term) {
    // Add optional spaces or special characters between letters to catch "n i g g e r" or "n-i-g-g-e-r"
    if (pattern) {
      pattern += '[\\s\\W]*';
    }
    
    // Replace character with its possible variations, or keep as is
    pattern += charMap[char.toLowerCase()] || char;
  }
  return new RegExp(`\\b${pattern}\\b`, 'i');
};

// Create regex patterns for each offensive term
const OFFENSIVE_PATTERNS = OFFENSIVE_TERMS.map(term => createObfuscationPattern(term));

/**
 * Checks if a text contains offensive content
 * @param {string} text - The text to check
 * @returns {Object} Result with isOffensive flag and reason if offensive
 */
export const checkForOffensiveContent = (text) => {
  if (!text) {
    return { isOffensive: false };
  }

  // Normalize text for better detection
  const normalizedText = text.toLowerCase();
  
  // Check for offensive patterns
  for (let i = 0; i < OFFENSIVE_PATTERNS.length; i++) {
    if (OFFENSIVE_PATTERNS[i].test(normalizedText)) {
      return { 
        isOffensive: true, 
        reason: `Contains inappropriate language (matched pattern ${i+1})` 
      };
    }
  }
  
  // Check for excessive use of capitalization (potential shouting/aggression)
  const uppercaseRatio = text.replace(/[^a-zA-Z]/g, '').split('').filter(c => c === c.toUpperCase()).length / text.replace(/[^a-zA-Z]/g, '').length;
  if (text.length > 20 && uppercaseRatio > 0.7) {
    return { 
      isOffensive: true, 
      reason: 'Excessive capitalization which may indicate shouting or aggressive tone' 
    };
  }
  
  return { isOffensive: false };
};

/**
 * Filters out offensive words and replaces them with asterisks
 * @param {string} text - The text to filter
 * @returns {string} Filtered text with offensive words censored
 */
export const filterOffensiveWords = (text) => {
  if (!text) return text;
  
  let filteredText = text;
  
  for (let i = 0; i < OFFENSIVE_TERMS.length; i++) {
    const term = OFFENSIVE_TERMS[i];
    const pattern = new RegExp(`\\b${term}\\b`, 'gi');
    filteredText = filteredText.replace(pattern, '*'.repeat(term.length));
  }
  
  return filteredText;
};

/**
 * Validates content before posting
 * @param {string} title - Post title
 * @param {string} body - Post body
 * @returns {Object} Validation result with isValid flag and error message if invalid
 */
export const validatePostContent = (title, body) => {
  const titleCheck = checkForOffensiveContent(title);
  if (titleCheck.isOffensive) {
    return {
      isValid: false,
      errorMessage: `Your post title contains inappropriate content. ${titleCheck.reason}`
    };
  }
  
  const bodyCheck = checkForOffensiveContent(body);
  if (bodyCheck.isOffensive) {
    return {
      isValid: false,
      errorMessage: `Your post content contains inappropriate content. ${bodyCheck.reason}`
    };
  }
  
  return { isValid: true };
};

/**
 * Validates a comment before posting
 * @param {string} comment - The comment text
 * @returns {Object} Validation result with isValid flag and error message if invalid
 */
export const validateCommentContent = (comment) => {
  const commentCheck = checkForOffensiveContent(comment);
  if (commentCheck.isOffensive) {
    return {
      isValid: false,
      errorMessage: `Your comment contains inappropriate content. ${commentCheck.reason}`
    };
  }
  
  return { isValid: true };
}; 