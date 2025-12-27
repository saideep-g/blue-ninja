/**
 * src/services/questionValidator.js
 * ================================
 * 
 * Production-ready 4-tier question validation system for admin question uploads.
 * 
 * Validation Tiers:
 * - Tier 1: Schema validation (required fields, types)
 * - Tier 2: Options validation (duplicates, correct answer exists)
 * - Tier 3: Metadata validation (atoms, tags, curriculum mapping)
 * - Tier 4: Quality assessment (completeness scoring, recommendations)
 * 
 * Usage:
 * ------
 * const result = await validateQuestion(question, curriculum);
 * if (!result.isValid) {
 *   console.log('Errors:', result.errors);
 *   console.log('Warnings:', result.warnings);
 * }
 */

// ============================================================================
// TIER 1: SCHEMA VALIDATION
// ============================================================================

/**
 * Validates question has all required fields with correct types
 * @param {Object} question - Question object to validate
 * @returns {Object} { isValid, errors, warnings }
 */
export async function validateQuestionSchema(question) {
  const errors = [];
  const warnings = [];

  if (!question) {
    return {
      isValid: false,
      errors: [{
        severity: 'CRITICAL',
        code: 'NULL_QUESTION',
        message: 'Question object is null or undefined'
      }],
      warnings: []
    };
  }

  // Required fields check
  const required = ['id', 'atom', 'type', 'content', 'options', 'correctAnswer', 'diagnosticTags'];
  
  for (const field of required) {
    if (question[field] === undefined || question[field] === null) {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_REQUIRED_FIELD',
        field,
        message: `Required field "${field}" is missing or null`
      });
    }
  }

  // Field type validation
  if (typeof question.id !== 'string' || question.id.trim().length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_QUESTION_ID',
      message: 'Question ID must be a non-empty string',
      received: typeof question.id
    });
  }

  // ID format validation (alphanumeric with underscore/hyphen)
  if (question.id && !/^[a-zA-Z0-9_-]+$/.test(question.id)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_ID_FORMAT',
      message: 'Question ID should only contain alphanumeric characters, hyphens, and underscores',
      value: question.id
    });
  }

  if (typeof question.atom !== 'string' || question.atom.trim().length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_ATOM',
      message: 'Atom must be a non-empty string',
      received: typeof question.atom
    });
  }

  // Type validation
  const validTypes = ['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'ESSAY', 'TRUE_FALSE', 'MATCHING'];
  if (!validTypes.includes(question.type)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_QUESTION_TYPE',
      message: `Question type must be one of: ${validTypes.join(', ')}`,
      received: question.type,
      validTypes
    });
  }

  // Content validation
  if (typeof question.content !== 'object' || question.content === null) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_CONTENT',
      message: 'Content must be an object',
      received: typeof question.content
    });
  } else if (!question.content.question || question.content.question.trim().length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'EMPTY_QUESTION_TEXT',
      message: 'Question content text cannot be empty',
      value: question.content.question
    });
  }

  // Correct answer validation
  if (typeof question.correctAnswer !== 'string' || question.correctAnswer.trim().length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_CORRECT_ANSWER',
      message: 'Correct answer must be a non-empty string',
      received: typeof question.correctAnswer
    });
  }

  // Diagnostic tags validation
  if (!Array.isArray(question.diagnosticTags)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_DIAGNOSTIC_TAGS',
      message: 'Diagnostic tags must be an array',
      received: typeof question.diagnosticTags
    });
  }

  // Options array validation
  if (!Array.isArray(question.options)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_OPTIONS_FORMAT',
      message: 'Options must be an array',
      received: typeof question.options
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// TIER 2: OPTIONS VALIDATION
// ============================================================================

/**
 * Validates question options for common issues
 * @param {Object} question - Question object
 * @returns {Object} { isValid, errors, warnings }
 */
export async function validateOptions(question) {
  const errors = [];
  const warnings = [];

  if (!question.options || !Array.isArray(question.options)) {
    return { isValid: false, errors: [{
      severity: 'CRITICAL',
      code: 'NO_OPTIONS',
      message: 'Question must have options'
    }], warnings };
  }

  const options = question.options;
  const MIN_OPTIONS = 2;
  const MAX_OPTIONS = 6;

  // Option count validation
  if (options.length < MIN_OPTIONS) {
    errors.push({
      severity: 'CRITICAL',
      code: 'TOO_FEW_OPTIONS',
      message: `Question must have at least ${MIN_OPTIONS} options, found ${options.length}`,
      found: options.length,
      minimum: MIN_OPTIONS
    });
  }

  if (options.length > MAX_OPTIONS) {
    errors.push({
      severity: 'CRITICAL',
      code: 'TOO_MANY_OPTIONS',
      message: `Question should have at most ${MAX_OPTIONS} options, found ${options.length}`,
      found: options.length,
      maximum: MAX_OPTIONS
    });
  }

  // Check for duplicate options (case-insensitive)
  const optionTexts = options
    .map(o => (typeof o === 'string' ? o : o?.text || '').trim().toLowerCase())
    .filter(t => t.length > 0);

  const duplicates = optionTexts.filter((text, idx) => optionTexts.indexOf(text) !== idx);
  if (duplicates.length > 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'DUPLICATE_OPTIONS',
      message: `Found ${duplicates.length} duplicate option(s): ${[...new Set(duplicates)].join(', ')}`,
      duplicates: [...new Set(duplicates)]
    });
  }

  // Check if correct answer exists in options
  const correctAnswer = question.correctAnswer ? question.correctAnswer.trim() : '';
  const optionValues = options.map(o => 
    (typeof o === 'string' ? o : o?.text || '').trim()
  );

  const correctAnswerExists = optionValues.some(opt => opt === correctAnswer);
  if (!correctAnswerExists && correctAnswer.length > 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_CORRECT_ANSWER',
      message: `Correct answer "${correctAnswer}" not found in options`,
      correctAnswer,
      availableOptions: optionValues.filter(o => o.length > 0)
    });
  }

  // Check for empty options
  options.forEach((opt, idx) => {
    const text = (typeof opt === 'string' ? opt : opt?.text || '').trim();
    if (text.length === 0) {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_OPTION',
        index: idx,
        message: `Option ${idx + 1} is empty`
      });
    }
  });

  // Check for very long options (potential formatting issue)
  options.forEach((opt, idx) => {
    const text = (typeof opt === 'string' ? opt : opt?.text || '').trim();
    if (text.length > 500) {
      warnings.push({
        severity: 'WARNING',
        code: 'VERY_LONG_OPTION',
        index: idx,
        length: text.length,
        message: `Option ${idx + 1} is very long (${text.length} chars) - may cause display issues`
      });
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// TIER 3: METADATA VALIDATION
// ============================================================================

/**
 * Validates question metadata against curriculum
 * @param {Object} question - Question object
 * @param {Object} curriculum - Curriculum/atom reference (optional)
 * @returns {Object} { isValid, errors, warnings }
 */
export async function validateMetadata(question, curriculum = null) {
  const errors = [];
  const warnings = [];

  // Atom validation
  if (!question.atom || question.atom.trim().length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_ATOM',
      message: 'Question must be mapped to a curriculum atom'
    });
  } else if (curriculum && curriculum.atoms) {
    // Check if atom exists in curriculum
    const atomExists = curriculum.atoms.includes(question.atom);
    if (!atomExists) {
      warnings.push({
        severity: 'WARNING',
        code: 'ATOM_NOT_IN_CURRICULUM',
        atom: question.atom,
        message: `Atom "${question.atom}" not found in current curriculum`
      });
    }
  }

  // Diagnostic tags validation
  if (!Array.isArray(question.diagnosticTags) || question.diagnosticTags.length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_DIAGNOSTIC_TAGS',
      message: 'Question must have at least one diagnostic tag (misconception/skill tag)'
    });
  } else {
    // Check for empty strings in tags
    question.diagnosticTags.forEach((tag, idx) => {
      if (typeof tag !== 'string' || tag.trim().length === 0) {
        errors.push({
          severity: 'CRITICAL',
          code: 'EMPTY_DIAGNOSTIC_TAG',
          index: idx,
          message: `Diagnostic tag at index ${idx} is empty or invalid`
        });
      }
    });
  }

  // Bloom level validation (optional but recommended)
  const validBloomLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  if (question.bloomLevel && !validBloomLevels.includes(question.bloomLevel)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_BLOOM_LEVEL',
      received: question.bloomLevel,
      message: `Bloom level should be one of: ${validBloomLevels.join(', ')}`,
      validBloomLevels
    });
  }

  // Difficulty validation
  const validDifficulties = ['EASY', 'MEDIUM', 'HARD'];
  if (question.difficulty && !validDifficulties.includes(question.difficulty)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_DIFFICULTY',
      received: question.difficulty,
      message: `Difficulty should be one of: ${validDifficulties.join(', ')}`,
      validDifficulties
    });
  }

  // Time limit validation (optional)
  if (question.timeLimit) {
    if (typeof question.timeLimit !== 'number' || question.timeLimit < 5000 || question.timeLimit > 300000) {
      warnings.push({
        severity: 'WARNING',
        code: 'UNUSUAL_TIME_LIMIT',
        timeLimit: question.timeLimit,
        message: 'Time limit should be between 5-300 seconds (5000-300000 ms)',
        recommended: '30000 (30 seconds)'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

// ============================================================================
// TIER 4: QUALITY ASSESSMENT
// ============================================================================

/**
 * Assesses overall question quality and provides improvement suggestions
 * @param {Object} question - Question object
 * @returns {Object} { qualityScore, qualityGrade, suggestions }
 */
export async function assessQuestionQuality(question) {
  let score = 1.0; // Start at 100%
  const suggestions = [];

  // Has common misconceptions documented
  if (!question.commonMisconceptions || !Array.isArray(question.commonMisconceptions) || question.commonMisconceptions.length === 0) {
    score -= 0.15;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'MISSING_MISCONCEPTIONS',
      message: 'Consider adding 2-3 common misconceptions. This helps with diagnostic analysis.',
      impact: '-15%'
    });
  }

  // Has difficulty rating
  if (!question.difficulty) {
    score -= 0.10;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'MISSING_DIFFICULTY',
      message: 'Add difficulty rating: EASY, MEDIUM, or HARD',
      impact: '-10%'
    });
  }

  // Has Bloom level
  if (!question.bloomLevel) {
    score -= 0.10;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'MISSING_BLOOM_LEVEL',
      message: 'Add Bloom taxonomy level for better curriculum alignment',
      impact: '-10%'
    });
  }

  // Has time estimate
  if (!question.timeLimit) {
    score -= 0.05;
    suggestions.push({
      priority: 'LOW',
      code: 'MISSING_TIME_LIMIT',
      message: 'Consider adding estimated time to answer (e.g., 30000 for 30 seconds)',
      impact: '-5%'
    });
  }

  // Check explanation/reasoning
  if (!question.explanation || question.explanation.trim().length === 0) {
    score -= 0.15;
    suggestions.push({
      priority: 'HIGH',
      code: 'MISSING_EXPLANATION',
      message: 'Add explanation of why correct answer is right. This helps student learning.',
      impact: '-15%'
    });
  }

  // Check for content metadata
  if (!question.content || !question.content.context) {
    score -= 0.05;
    suggestions.push({
      priority: 'LOW',
      code: 'MISSING_CONTEXT',
      message: 'Consider adding context to make question more meaningful',
      impact: '-5%'
    });
  }

  // Ensure all diagnostic tags are present
  if (!question.diagnosticTags || question.diagnosticTags.length < 2) {
    score -= 0.10;
    suggestions.push({
      priority: 'MEDIUM',
      code: 'INSUFFICIENT_TAGS',
      message: 'Add multiple diagnostic tags for better skill tracking',
      impact: '-10%'
    });
  }

  // Calculate grade
  let qualityGrade = 'F';
  if (score >= 0.90) qualityGrade = 'A';
  else if (score >= 0.80) qualityGrade = 'B';
  else if (score >= 0.70) qualityGrade = 'C';
  else if (score >= 0.60) qualityGrade = 'D';

  return {
    qualityScore: Math.max(0, score),
    qualityGrade,
    suggestions,
    completenessPercent: Math.round(Math.max(0, score) * 100)
  };
}

// ============================================================================
// MASTER VALIDATION FUNCTION
// ============================================================================

/**
 * Orchestrates all 4 tiers of question validation
 * @param {Object} question - Question object to validate
 * @param {Object} curriculum - Optional curriculum reference
 * @returns {Object} Complete validation result
 */
export async function validateQuestion(question, curriculum = null) {
  const startTime = performance.now();

  const result = {
    questionId: question?.id || 'UNKNOWN',
    isValid: true,
    validatedAt: new Date().toISOString(),
    validationTimeMs: 0,
    qualityGrade: 'F',
    qualityScore: 0,
    errors: [],
    warnings: [],
    suggestions: [],
    tiers: {
      schema: null,
      options: null,
      metadata: null,
      quality: null
    }
  };

  try {
    // TIER 1: Schema validation
    result.tiers.schema = await validateQuestionSchema(question);
    if (!result.tiers.schema.isValid) {
      result.errors.push(...result.tiers.schema.errors);
      result.isValid = false;
    }
    result.warnings.push(...result.tiers.schema.warnings);

    // Stop here if schema is invalid - other tiers depend on schema
    if (!result.isValid) {
      result.validationTimeMs = Math.round(performance.now() - startTime);
      return result;
    }

    // TIER 2: Options validation
    result.tiers.options = await validateOptions(question);
    if (!result.tiers.options.isValid) {
      result.errors.push(...result.tiers.options.errors);
      result.isValid = false;
    }
    result.warnings.push(...result.tiers.options.warnings);

    // TIER 3: Metadata validation
    result.tiers.metadata = await validateMetadata(question, curriculum);
    if (!result.tiers.metadata.isValid) {
      result.errors.push(...result.tiers.metadata.errors);
      result.isValid = false;
    }
    result.warnings.push(...result.tiers.metadata.warnings);

    // TIER 4: Quality assessment (only if valid)
    if (result.isValid) {
      result.tiers.quality = await assessQuestionQuality(question);
      result.qualityScore = result.tiers.quality.qualityScore;
      result.qualityGrade = result.tiers.quality.qualityGrade;
      result.suggestions = result.tiers.quality.suggestions;
    }
  } catch (error) {
    result.errors.push({
      severity: 'ERROR',
      code: 'VALIDATION_ERROR',
      message: `Unexpected error during validation: ${error.message}`,
      stack: error.stack
    });
    result.isValid = false;
  }

  result.validationTimeMs = Math.round(performance.now() - startTime);
  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gets human-readable summary of validation errors
 * @param {Object} validationResult - Result from validateQuestion
 * @returns {String} Formatted error message
 */
export function formatValidationErrors(validationResult) {
  if (!validationResult.errors || validationResult.errors.length === 0) {
    return 'No errors found';
  }

  return validationResult.errors
    .map((err, idx) => `${idx + 1}. [${err.severity}] ${err.code}: ${err.message}`)
    .join('\n');
}

/**
 * Converts validation result to display object
 * @param {Object} validationResult - Result from validateQuestion
 * @returns {Object} Display-friendly format
 */
export function prepareValidationForDisplay(validationResult) {
  return {
    questionId: validationResult.questionId,
    status: validationResult.isValid ? 'VALID' : 'INVALID',
    qualityGrade: validationResult.qualityGrade,
    qualityPercent: Math.round(validationResult.qualityScore * 100),
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    suggestionCount: validationResult.suggestions.length,
    errors: validationResult.errors.map(e => ({
      code: e.code,
      message: e.message,
      severity: e.severity
    })),
    warnings: validationResult.warnings.map(w => ({
      code: w.code,
      message: w.message
    })),
    suggestions: validationResult.suggestions.map(s => ({
      priority: s.priority,
      message: s.message
    }))
  };
}

export default {
  validateQuestion,
  validateQuestionSchema,
  validateOptions,
  validateMetadata,
  assessQuestionQuality,
  formatValidationErrors,
  prepareValidationForDisplay
};
