/**
 * src/services/questionValidator.js
 * Comprehensive question validation with 4 tiers
 * Validates question structure, options, metadata, and quality
 * Production-ready with full error reporting
 */

import { advancedValidationService } from './advancedValidationService.js';

/**
 * TIER 1: Question Schema Validation
 * Ensures question has all required fields with correct types
 */
export async function validateQuestionSchema(question) {
  const errors = [];
  const warnings = [];
  
  // Required fields
  const requiredFields = {
    id: 'string',
    atom: 'string',
    type: 'string',
    content: 'object',
    options: 'array',
    correctAnswer: 'string',
    diagnosticTags: 'array'
  };
  
  for (const [field, expectedType] of Object.entries(requiredFields)) {
    if (!(field in question)) {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_REQUIRED_FIELD',
        field,
        message: `Required field "${field}" is missing`,
        tier: 1
      });
      continue;
    }
    
    const value = question[field];
    const actualType = Array.isArray(value) ? 'array' : typeof value;
    
    if (actualType !== expectedType) {
      errors.push({
        severity: 'CRITICAL',
        code: 'INVALID_FIELD_TYPE',
        field,
        expectedType,
        actualType,
        message: `Field "${field}" must be ${expectedType}, got ${actualType}`,
        tier: 1
      });
    }
  }
  
  // Question ID validation (format and length)
  if (question.id && typeof question.id === 'string') {
    if (question.id.length < 2) {
      errors.push({
        severity: 'CRITICAL',
        code: 'INVALID_QUESTION_ID_FORMAT',
        message: 'Question ID must be at least 2 characters',
        currentLength: question.id.length,
        tier: 1
      });
    }
    
    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[a-zA-Z0-9_-]+$/.test(question.id)) {
      errors.push({
        severity: 'WARNING',
        code: 'QUESTION_ID_SPECIAL_CHARS',
        message: 'Question ID should contain only alphanumeric characters, underscore, or hyphen',
        currentId: question.id,
        tier: 1
      });
    }
  }
  
  // Question type validation
  const validTypes = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE', 'FILL_BLANK'];
  if (question.type && !validTypes.includes(question.type)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_QUESTION_TYPE',
      message: `Question type must be one of: ${validTypes.join(', ')}`,
      providedType: question.type,
      tier: 1
    });
  }
  
  // Content validation
  if (question.content && typeof question.content === 'object') {
    if (!question.content.question || typeof question.content.question !== 'string') {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_QUESTION_TEXT',
        message: 'Question content must have a "question" field with text',
        tier: 1
      });
    }
    
    if (question.content.question && question.content.question.trim().length === 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_QUESTION_TEXT',
        message: 'Question text cannot be empty',
        tier: 1
      });
    }
  }
  
  // Atom validation
  if (question.atom && typeof question.atom === 'string') {
    if (question.atom.trim().length === 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_ATOM',
        message: 'Atom (curriculum unit) cannot be empty',
        tier: 1
      });
    }
  }
  
  // Diagnostic tags validation
  if (question.diagnosticTags && Array.isArray(question.diagnosticTags)) {
    if (question.diagnosticTags.length === 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_DIAGNOSTIC_TAGS',
        message: 'At least one diagnostic tag is required',
        tier: 1
      });
    }
    
    // Check for empty tags
    const emptyTags = question.diagnosticTags.filter(tag => 
      typeof tag !== 'string' || tag.trim().length === 0
    );
    if (emptyTags.length > 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_TAG_VALUE',
        message: `Found ${emptyTags.length} empty diagnostic tag(s)`,
        count: emptyTags.length,
        tier: 1
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tier: 'SCHEMA'
  };
}

/**
 * TIER 2: Options Validation
 * Checks for common option errors: duplicates, missing correct answer, etc.
 */
export async function validateOptions(question) {
  const errors = [];
  const warnings = [];
  
  // Skip for non-multiple choice questions
  if (question.type && !['MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(question.type)) {
    return { isValid: true, errors, warnings, tier: 'OPTIONS' };
  }
  
  const options = question.options || [];
  
  // Must have 2-6 options (configurable, defaults to 2-4)
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 6;
  
  if (options.length < MIN_OPTIONS || options.length > MAX_OPTIONS) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_OPTION_COUNT',
      message: `Must have ${MIN_OPTIONS}-${MAX_OPTIONS} options, found ${options.length}`,
      minOptions: MIN_OPTIONS,
      maxOptions: MAX_OPTIONS,
      currentCount: options.length,
      tier: 2
    });
  }
  
  // Check for empty options
  options.forEach((opt, idx) => {
    if (!opt || typeof opt !== 'object') {
      errors.push({
        severity: 'CRITICAL',
        code: 'INVALID_OPTION_FORMAT',
        index: idx,
        message: `Option ${idx} must be an object with a text field`,
        tier: 2
      });
      return;
    }
    
    if (!opt.text || typeof opt.text !== 'string') {
      errors.push({
        severity: 'CRITICAL',
        code: 'OPTION_MISSING_TEXT',
        index: idx,
        message: `Option ${idx} must have a "text" field`,
        tier: 2
      });
      return;
    }
    
    if (opt.text.trim().length === 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_OPTION_TEXT',
        index: idx,
        message: `Option ${idx} text cannot be empty`,
        tier: 2
      });
    }
  });
  
  // Check for duplicate options (case-insensitive)
  const optionTexts = options
    .filter(o => o && o.text && typeof o.text === 'string')
    .map(o => o.text.trim().toLowerCase());
  
  const seen = new Set();
  const duplicates = [];
  
  optionTexts.forEach((text, idx) => {
    if (seen.has(text)) {
      duplicates.push({
        text: options[idx].text,
        indices: optionTexts
          .map((t, i) => t === text ? i : -1)
          .filter(i => i !== -1)
      });
    }
    seen.add(text);
  });
  
  if (duplicates.length > 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'DUPLICATE_OPTIONS',
      message: `Found ${duplicates.length} duplicate option(s)`,
      duplicates,
      tier: 2
    });
  }
  
  // Correct answer must exist in options
  if (question.correctAnswer && typeof question.correctAnswer === 'string') {
    const hasCorrect = options.some(o => 
      o && o.text && o.text.trim() === question.correctAnswer.trim()
    );
    
    if (!hasCorrect) {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_CORRECT_ANSWER',
        message: `Correct answer "${question.correctAnswer}" not found in options`,
        correctAnswer: question.correctAnswer,
        availableOptions: options
          .filter(o => o && o.text)
          .map(o => o.text),
        tier: 2
      });
    }
  }
  
  // Check option text length (not too long, not too short)
  options.forEach((opt, idx) => {
    if (!opt || !opt.text) return;
    
    if (opt.text.trim().length > 500) {
      warnings.push({
        severity: 'WARNING',
        code: 'OPTION_TOO_LONG',
        index: idx,
        message: `Option ${idx} is very long (${opt.text.length} chars), consider shortening`,
        length: opt.text.length,
        tier: 2
      });
    }
    
    if (opt.text.trim().length < 2) {
      warnings.push({
        severity: 'WARNING',
        code: 'OPTION_TOO_SHORT',
        index: idx,
        message: `Option ${idx} is very short, might not be clear enough`,
        tier: 2
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tier: 'OPTIONS'
  };
}

/**
 * TIER 3: Metadata Validation
 * Validates atoms, diagnostic tags, and other metadata
 */
export async function validateMetadata(question, curriculum = null) {
  const errors = [];
  const warnings = [];
  
  // Atom validation
  if (!question.atom || (typeof question.atom === 'string' && question.atom.trim() === '')) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_ATOM',
      message: 'Question must be mapped to a curriculum atom',
      tier: 3
    });
  } else if (curriculum && curriculum.atoms && typeof curriculum.atoms === 'object') {
    const atomsList = Array.isArray(curriculum.atoms) 
      ? curriculum.atoms 
      : Object.keys(curriculum.atoms);
    
    if (!atomsList.includes(question.atom)) {
      warnings.push({
        severity: 'WARNING',
        code: 'ATOM_NOT_IN_CURRICULUM',
        atom: question.atom,
        message: `Atom "${question.atom}" not found in current curriculum`,
        availableAtoms: atomsList.slice(0, 5), // Show first 5
        tier: 3
      });
    }
  }
  
  // Diagnostic tags validation
  if (!question.diagnosticTags || !Array.isArray(question.diagnosticTags)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_DIAGNOSTIC_TAGS',
      message: 'Question must have diagnostic tags (misconception tags)',
      tier: 3
    });
  } else if (question.diagnosticTags.length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'EMPTY_DIAGNOSTIC_TAGS_ARRAY',
      message: 'Diagnostic tags array cannot be empty',
      tier: 3
    });
  }
  
  // Bloom level validation (optional but recommended)
  const validBloomLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  if (question.bloomLevel && !validBloomLevels.includes(question.bloomLevel)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_BLOOM_LEVEL',
      message: `Bloom level should be one of: ${validBloomLevels.join(', ')}`,
      providedLevel: question.bloomLevel,
      validLevels: validBloomLevels,
      tier: 3
    });
  }
  
  // Difficulty validation (optional but recommended)
  const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
  if (question.difficulty && !validDifficulties.includes(question.difficulty)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_DIFFICULTY',
      message: `Difficulty should be one of: ${validDifficulties.join(', ')}`,
      providedDifficulty: question.difficulty,
      validDifficulties,
      tier: 3
    });
  }
  
  // Time limit validation (optional, in milliseconds)
  if (question.timeLimit !== undefined && typeof question.timeLimit === 'number') {
    if (question.timeLimit < 5000 || question.timeLimit > 300000) {
      warnings.push({
        severity: 'WARNING',
        code: 'UNUSUAL_TIME_LIMIT',
        message: 'Time limit is outside typical range (5s - 5min). Current: ' + 
                  (question.timeLimit / 1000) + 's',
        currentSeconds: question.timeLimit / 1000,
        suggestedRange: '5000-300000ms (5s-5min)',
        tier: 3
      });
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    tier: 'METADATA'
  };
}

/**
 * TIER 4: Quality Metrics
 * Scores question quality and provides recommendations
 */
export async function assessQuestionQuality(question) {
  let score = 1.0; // Start at 100%
  const suggestions = [];
  const metrics = {};
  
  // Check question text length (150-500 chars is ideal)
  const questionLength = question.content?.question?.length || 0;
  if (questionLength < 20) {
    score -= 0.15;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'SHORT_QUESTION_TEXT',
      message: 'Question text is very short. Make it more descriptive.',
      currentLength: questionLength,
      suggestedRange: '20-500 characters'
    });
    metrics.questionLength = 'TOO_SHORT';
  } else if (questionLength > 500) {
    score -= 0.1;
    suggestions.push({
      priority: 'LOW',
      code: 'LONG_QUESTION_TEXT',
      message: 'Question text is quite long. Consider breaking it up.',
      currentLength: questionLength,
      suggestedRange: '20-500 characters'
    });
    metrics.questionLength = 'TOO_LONG';
  } else {
    metrics.questionLength = 'IDEAL';
  }
  
  // Check for common misconceptions
  if (!question.commonMisconceptions || question.commonMisconceptions.length === 0) {
    score -= 0.15;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'NO_MISCONCEPTIONS',
      message: 'Consider adding common misconceptions to help with diagnostic analysis'
    });
    metrics.misconceptions = 'MISSING';
  } else {
    metrics.misconceptions = question.commonMisconceptions.length;
  }
  
  // Check difficulty estimate
  if (!question.difficulty) {
    score -= 0.1;
    suggestions.push({
      priority: 'LOW',
      code: 'NO_DIFFICULTY_RATING',
      message: 'Consider rating difficulty: EASY, MEDIUM, HARD'
    });
    metrics.difficulty = 'MISSING';
  } else {
    metrics.difficulty = question.difficulty;
  }
  
  // Check Bloom level
  if (!question.bloomLevel) {
    score -= 0.1;
    suggestions.push({
      priority: 'LOW',
      code: 'NO_BLOOM_LEVEL',
      message: 'Consider assigning Bloom level (REMEMBER, UNDERSTAND, APPLY, etc.)'
    });
    metrics.bloomLevel = 'MISSING';
  } else {
    metrics.bloomLevel = question.bloomLevel;
  }
  
  // Check time estimate
  const hasTimeLimit = question.timeLimit !== undefined && question.timeLimit > 0;
  if (!hasTimeLimit) {
    score -= 0.05;
    suggestions.push({
      priority: 'LOW',
      code: 'NO_TIME_LIMIT',
      message: 'Consider setting a time limit (10-120 seconds typically)'
    });
    metrics.timeLimit = 'MISSING';
  } else {
    metrics.timeLimit = `${question.timeLimit / 1000}s`;
  }
  
  // Check for context/explanation
  if (question.content?.context) {
    metrics.hasContext = true;
  } else {
    score -= 0.05;
    metrics.hasContext = false;
  }
  
  // Number of options (more options = harder but more reliable)
  const optionCount = (question.options || []).length;
  metrics.optionCount = optionCount;
  
  // Check for images/diagrams
  if (question.content?.image || question.content?.diagram) {
    metrics.hasVisuals = true;
  } else {
    metrics.hasVisuals = false;
  }
  
  // Ensure score doesn't go negative
  const finalScore = Math.max(0, score);
  const gradeMap = {
    A: finalScore > 0.85,
    B: finalScore > 0.7,
    C: finalScore > 0.55,
    D: finalScore > 0.4,
    F: finalScore <= 0.4
  };
  
  let grade = 'F';
  for (const [g, condition] of Object.entries(gradeMap)) {
    if (condition) {
      grade = g;
      break;
    }
  }
  
  return {
    qualityScore: finalScore,
    qualityGrade: grade,
    suggestions,
    metrics
  };
}

/**
 * MASTER VALIDATION FUNCTION
 * Orchestrates all question validation tiers
 * This is the main entry point for validating a single question
 */
export async function validateQuestion(question, curriculum = null) {
  if (!question) {
    return {
      questionId: null,
      isValid: false,
      qualityGrade: 'F',
      qualityScore: 0,
      errors: [
        {
          severity: 'CRITICAL',
          code: 'QUESTION_NULL_OR_UNDEFINED',
          message: 'Question object is null or undefined',
          tier: 0
        }
      ],
      warnings: [],
      tiers: {
        schema: null,
        options: null,
        metadata: null,
        quality: null
      }
    };
  }
  
  const results = {
    questionId: question.id || null,
    isValid: true,
    qualityGrade: 'A',
    qualityScore: 1.0,
    errors: [],
    warnings: [],
    validatedAt: new Date().toISOString(),
    tiers: {
      schema: null,
      options: null,
      metadata: null,
      quality: null
    }
  };
  
  // Tier 1: Schema validation
  results.tiers.schema = await validateQuestionSchema(question);
  if (!results.tiers.schema.isValid) {
    results.errors.push(...results.tiers.schema.errors);
    results.isValid = false;
  }
  results.warnings.push(...results.tiers.schema.warnings);
  
  // Skip remaining tiers if schema validation failed
  if (!results.tiers.schema.isValid) {
    results.qualityGrade = 'F';
    results.qualityScore = 0;
    return results;
  }
  
  // Tier 2: Options validation
  results.tiers.options = await validateOptions(question);
  if (!results.tiers.options.isValid) {
    results.errors.push(...results.tiers.options.errors);
    results.isValid = false;
  }
  results.warnings.push(...results.tiers.options.warnings);
  
  // Tier 3: Metadata validation
  results.tiers.metadata = await validateMetadata(question, curriculum);
  if (!results.tiers.metadata.isValid) {
    results.errors.push(...results.tiers.metadata.errors);
    results.isValid = false;
  }
  results.warnings.push(...results.tiers.metadata.warnings);
  
  // Tier 4: Quality assessment (always run, doesn't affect isValid)
  results.tiers.quality = await assessQuestionQuality(question);
  results.qualityScore = results.tiers.quality.qualityScore;
  results.qualityGrade = results.tiers.quality.qualityGrade;
  
  return results;
}

export default {
  validateQuestion,
  validateQuestionSchema,
  validateOptions,
  validateMetadata,
  assessQuestionQuality
};
