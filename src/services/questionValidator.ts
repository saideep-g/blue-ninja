/**
 * Question Validator: 4-Tier Validation System for v2.0
 * 
 * Comprehensive validation ensuring questions meet all requirements:
 * Tier 1: Schema (structure, types, required fields)
 * Tier 2: Template-Specific (template rules and constraints)
 * Tier 3: Metadata & Curriculum (alignment with curriculum)
 * Tier 4: Quality Assessment (content completeness)
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValidationError {
  severity: 'CRITICAL' | 'WARNING';
  code: string;
  field: string;
  message: string;
  expected?: any;
  actual?: any;
  suggestedFix?: string;
}

export interface ValidationResult {
  questionId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  quality: QualityAssessment | null;
  tiers: {
    schema?: TierResult;
    template?: TierResult;
    metadata?: TierResult;
    quality?: TierResult;
  };
}

export interface TierResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export interface QualityAssessment {
  qualityScore: number; // 0-1
  qualityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  suggestions: QualitySuggestion[];
}

export interface QualitySuggestion {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  field: string;
}

export interface BulkValidationResult {
  sessionId?: string;
  totalQuestions: number;
  validatedAt: string;
  summary: {
    totalValid: number;
    totalErrors: number;
    totalWarnings: number;
    qualityGradeDistribution: Record<string, number>;
  };
  questionResults: ValidationResult[];
  globalIssues: ValidationError[];
}

export interface CurriculumMetadata {
  modules: Array<{
    moduleId: string;
    atoms: Array<{
      atomId: string;
      bloomLevels?: string[];
      prerequisites?: string[];
    }>;
  }>;
}

// ============================================================================
// TIER 1: SCHEMA VALIDATION
// ============================================================================

/**
 * Validates required fields, data types, and basic structure
 * All questions must pass this tier
 */
export async function validateQuestionSchema(question: any): Promise<TierResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  // Check required fields
  const required = [
    'questionId', 'atomId', 'templateId', 'content',
    'interaction', 'answerKey', 'metadata'
  ];
  
  for (const field of required) {
    if (!question[field]) {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_REQUIRED_FIELD',
        field,
        message: `Field "${field}" is required for all questions`,
        expected: `Non-empty ${field}`,
        actual: question[field] || 'undefined'
      });
    }
  }
  
  // Validate questionId format
  if (question.questionId) {
    const qidPattern = /^MQ\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+\.[0-9]+$/;
    if (typeof question.questionId !== 'string' || question.questionId.length < 5) {
      errors.push({
        severity: 'CRITICAL',
        code: 'INVALID_QUESTION_ID',
        field: 'questionId',
        message: 'Question ID must be non-empty string (min 5 chars)',
        expected: 'Format: MQ.COURSE.CHAPTER.ATOM.TYPE.####',
        actual: question.questionId
      });
    }
  }
  
  // Validate templateId
  const validTemplates = [
    'MCQCONCEPT', 'TWOTIER', 'NUMERICINPUT', 'EXPRESSIONINPUT',
    'WORKEDEXAMPLECOMPLETE', 'STEPORDER', 'ERRORANALYSIS', 'CLASSIFYSORT',
    'NUMBERLINEPLACE', 'MATCHING', 'BALANCEOPS', 'GEOMETRYTAP',
    'MULTISTEPWORD', 'TRANSFERMINI', 'SIMULATION', 'SHORTEXPLAIN'
  ];
  
  if (question.templateId && !validTemplates.includes(question.templateId)) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_TEMPLATE',
      field: 'templateId',
      message: `Template "${question.templateId}" not supported`,
      expected: `One of: ${validTemplates.slice(0, 5).join(', ')}...`,
      actual: question.templateId
    });
  }
  
  // Validate content.prompt
  if (question.content) {
    if (!question.content.prompt?.text && !question.content.prompt?.latex) {
      errors.push({
        severity: 'CRITICAL',
        code: 'MISSING_PROMPT',
        field: 'content.prompt',
        message: 'Question must have either text or LaTeX prompt'
      });
    }
  }
  
  // Validate metadata structure
  if (question.metadata) {
    if (typeof question.metadata.difficulty !== 'number' || question.metadata.difficulty < 1 || question.metadata.difficulty > 5) {
      warnings.push({
        severity: 'WARNING',
        code: 'INVALID_DIFFICULTY',
        field: 'metadata.difficulty',
        message: 'Difficulty should be 1-5 (1=easy, 5=hard)',
        expected: '1-5',
        actual: String(question.metadata.difficulty)
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
// TIER 2: TEMPLATE-SPECIFIC VALIDATION
// ============================================================================

/**
 * Template-specific validation dispatches to appropriate validator
 */
export async function validateTemplateSpecific(question: any): Promise<TierResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const validators: Record<string, (q: any) => TierResult> = {
    'MCQCONCEPT': validateMCQ,
    'NUMERICINPUT': validateNumericInput,
    'BALANCEOPS': validateBalanceOps,
    'NUMBERLINEPLACE': validateNumberLine,
    'CLASSIFYSORT': validateClassifySort,
    'ERRORANALYSIS': validateErrorAnalysis,
    'EXPRESSINPUT': validateExpressionInput,
    'MATCHING': validateMatching,
    // Add other validators as needed
  };
  
  const validator = validators[question.templateId];
  if (validator) {
    const result = validator(question);
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * MCQ Validator: Multiple Choice Question
 */
function validateMCQ(q: any): TierResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const options = q.interaction?.config?.options || [];
  
  // Check option count
  if (options.length < 2 || options.length > 6) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_OPTION_COUNT',
      field: 'interaction.config.options',
      message: `MCQ must have 2-6 options`,
      expected: '2-6 options',
      actual: `${options.length} options`
    });
  }
  
  // Check for duplicate options
  const optionTexts = options.map(o => o.text?.trim().toLowerCase() || '');
  const duplicates = optionTexts.filter((t, i) => optionTexts.indexOf(t) !== i);
  
  if (duplicates.length > 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'DUPLICATE_OPTIONS',
      field: 'interaction.config.options',
      message: `Found duplicate options: ${[...new Set(duplicates)].join(', ')}`,
      suggestedFix: 'Ensure each option has unique text'
    });
  }
  
  // Check empty options
  options.forEach((opt, idx) => {
    if (!opt.text || opt.text.trim() === '') {
      errors.push({
        severity: 'CRITICAL',
        code: 'EMPTY_OPTION',
        field: `interaction.config.options[${idx}].text`,
        message: `Option ${idx + 1} is empty`,
        suggestedFix: `Provide text for option ${idx + 1}`
      });
    }
  });
  
  // Check correct answer
  const correctAnswer = q.answerKey?.correctOptionIndex;
  if (correctAnswer === undefined) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_CORRECT_ANSWER',
      field: 'answerKey.correctOptionIndex',
      message: 'Correct answer index must be specified',
      expected: `0 to ${options.length - 1}`,
      actual: 'undefined'
    });
  } else if (correctAnswer >= options.length) {
    errors.push({
      severity: 'CRITICAL',
      code: 'INVALID_CORRECT_ANSWER',
      field: 'answerKey.correctOptionIndex',
      message: `Correct answer index out of range`,
      expected: `0 to ${options.length - 1}`,
      actual: String(correctAnswer)
    });
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Numeric Input Validator
 */
function validateNumericInput(q: any): TierResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (q.answerKey?.value === undefined) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_ANSWER_VALUE',
      field: 'answerKey.value',
      message: 'Numeric input must have answerKey.value',
      suggestedFix: 'Add the correct numeric answer'
    });
  }
  
  if (q.answerKey?.tolerance === undefined) {
    warnings.push({
      severity: 'WARNING',
      code: 'MISSING_TOLERANCE',
      field: 'answerKey.tolerance',
      message: 'Consider adding tolerance for numeric answers',
      suggestedFix: 'Set tolerance (default: 0.01)'
    });
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Balance Operations Validator
 */
function validateBalanceOps(q: any): TierResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const config = q.interaction?.config;
  
  if (!config?.equation) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_EQUATION',
      field: 'interaction.config.equation',
      message: 'Balance Ops requires equation configuration'
    });
  }
  
  if (!config?.operations || config.operations.length === 0) {
    errors.push({
      severity: 'CRITICAL',
      code: 'MISSING_OPERATIONS',
      field: 'interaction.config.operations',
      message: 'Balance Ops requires at least one operation',
      suggestedFix: 'Add operations like ADD, SUBTRACT, MULTIPLY, DIVIDE'
    });
  }
  
  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Number Line Placement Validator
 */
function validateNumberLine(q: any): TierResult {
  const errors: ValidationError[] = [];
  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Classify & Sort Validator
 */
function validateClassifySort(q: any): TierResult {
  const errors: ValidationError[] = [];
  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Error Analysis Validator
 */
function validateErrorAnalysis(q: any): TierResult {
  const errors: ValidationError[] = [];
  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Expression Input Validator
 */
function validateExpressionInput(q: any): TierResult {
  const errors: ValidationError[] = [];
  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Matching Validator
 */
function validateMatching(q: any): TierResult {
  const errors: ValidationError[] = [];
  return { isValid: errors.length === 0, errors, warnings: [] };
}

// ============================================================================
// TIER 3: METADATA & CURRICULUM VALIDATION
// ============================================================================

/**
 * Validates metadata and curriculum alignment
 */
export async function validateMetadata(
  question: any,
  curriculum?: CurriculumMetadata
): Promise<TierResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  if (!curriculum) {
    return { isValid: true, errors, warnings };
  }
  
  // Check if atom exists in curriculum
  const atomExists = curriculum.modules.some(m =>
    m.atoms.some(a => a.atomId === question.atomId)
  );
  
  if (!atomExists) {
    warnings.push({
      severity: 'WARNING',
      code: 'ATOM_NOT_IN_CURRICULUM',
      field: 'atomId',
      message: `Atom "${question.atomId}" not found in curriculum`,
      suggestedFix: 'Check spelling or update curriculum'
    });
  }
  
  // Validate Bloom level
  const validBloomLevels = ['REMEMBER', 'UNDERSTAND', 'APPLY', 'ANALYZE', 'EVALUATE', 'CREATE'];
  if (question.metadata?.bloomLevel && !validBloomLevels.includes(question.metadata.bloomLevel)) {
    warnings.push({
      severity: 'WARNING',
      code: 'INVALID_BLOOM_LEVEL',
      field: 'metadata.bloomLevel',
      message: `Invalid Bloom level`,
      expected: validBloomLevels.join(', '),
      actual: question.metadata.bloomLevel
    });
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
 * Assesses pedagogical quality and content completeness
 */
export async function assessQuality(question: any): Promise<QualityAssessment> {
  let score = 1.0;
  const suggestions: QualitySuggestion[] = [];
  
  // Misconceptions scoring
  if (!question.misconceptions?.length) {
    score -= 0.2;
    suggestions.push({
      priority: 'HIGH',
      message: 'Add misconception tags to enable diagnostic feedback',
      field: 'misconceptions'
    });
  }
  
  // Transfer item scoring
  if (!question.transferItem) {
    score -= 0.15;
    suggestions.push({
      priority: 'MEDIUM',
      message: 'Consider adding a transfer item for generalization practice',
      field: 'transferItem'
    });
  }
  
  // Worked solution scoring
  if (!question.workedSolution?.steps?.length) {
    score -= 0.1;
    suggestions.push({
      priority: 'MEDIUM',
      message: 'Add step-by-step worked solution for scaffolded learning',
      field: 'workedSolution'
    });
  }
  
  // Feedback scoring
  if (!question.feedbackMap?.onCorrect) {
    score -= 0.08;
    suggestions.push({
      priority: 'MEDIUM',
      message: 'Add positive feedback for correct responses',
      field: 'feedbackMap.onCorrect'
    });
  }
  
  // Tags/classification
  if (!question.metadata?.tags?.length) {
    score -= 0.07;
    suggestions.push({
      priority: 'LOW',
      message: 'Add topic tags for better organization',
      field: 'metadata.tags'
    });
  }
  
  const finalScore = Math.max(0, score);
  
  return {
    qualityScore: finalScore,
    qualityGrade: finalScore > 0.85 ? 'A' : finalScore > 0.7 ? 'B' : finalScore > 0.55 ? 'C' : finalScore > 0.4 ? 'D' : 'F',
    suggestions
  };
}

// ============================================================================
// ORCHESTRATION: COMPLETE VALIDATION PIPELINE
// ============================================================================

/**
 * Main validation function: Runs all 4 tiers
 * 
 * @param question - Question to validate
 * @param curriculum - Optional curriculum metadata for Tier 3
 * @returns Comprehensive validation result with all tier results
 */
export async function validateQuestion(
  question: any,
  curriculum?: CurriculumMetadata
): Promise<ValidationResult> {
  const result: ValidationResult = {
    questionId: question.questionId || 'UNKNOWN',
    isValid: true,
    errors: [],
    warnings: [],
    quality: null,
    tiers: {}
  };
  
  // TIER 1: Schema
  result.tiers.schema = await validateQuestionSchema(question);
  if (!result.tiers.schema.isValid) {
    result.errors.push(...result.tiers.schema.errors);
    result.isValid = false;
  }
  result.warnings.push(...result.tiers.schema.warnings);
  
  // Only proceed to other tiers if schema is valid
  if (!result.isValid) {
    return result;
  }
  
  // TIER 2: Template-Specific
  result.tiers.template = await validateTemplateSpecific(question);
  if (!result.tiers.template.isValid) {
    result.errors.push(...result.tiers.template.errors);
    result.isValid = false;
  }
  result.warnings.push(...result.tiers.template.warnings);
  
  // TIER 3: Metadata & Curriculum
  if (curriculum) {
    result.tiers.metadata = await validateMetadata(question, curriculum);
    if (!result.tiers.metadata.isValid) {
      result.errors.push(...result.tiers.metadata.errors);
      result.isValid = false;
    }
    result.warnings.push(...result.tiers.metadata.warnings);
  }
  
  // TIER 4: Quality Assessment
  result.quality = await assessQuality(question);
  
  return result;
}

// ============================================================================
// BULK VALIDATION
// ============================================================================

/**
 * Validate entire batch of questions
 * 
 * @param questions - Array of questions to validate
 * @param curriculum - Optional curriculum metadata
 * @param sessionId - Optional session ID for tracking
 * @param onProgress - Optional callback for progress updates
 */
export async function validateBulkUpload(
  questions: any[],
  curriculum?: CurriculumMetadata,
  sessionId?: string,
  onProgress?: (current: number, total: number) => void
): Promise<BulkValidationResult> {
  const result: BulkValidationResult = {
    sessionId,
    totalQuestions: questions.length,
    validatedAt: new Date().toISOString(),
    summary: {
      totalValid: 0,
      totalErrors: 0,
      totalWarnings: 0,
      qualityGradeDistribution: {}
    },
    questionResults: [],
    globalIssues: []
  };
  
  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const validation = await validateQuestion(questions[i], curriculum);
    result.questionResults.push(validation);
    
    // Update summary
    if (validation.isValid) result.summary.totalValid++;
    if (validation.errors.length > 0) result.summary.totalErrors++;
    if (validation.warnings.length > 0) result.summary.totalWarnings++;
    
    if (validation.quality) {
      const grade = validation.quality.qualityGrade;
      result.summary.qualityGradeDistribution[grade] = 
        (result.summary.qualityGradeDistribution[grade] || 0) + 1;
    }
    
    // Call progress callback
    if (onProgress) {
      onProgress(i + 1, questions.length);
    }
  }
  
  // Check for global issues
  const questionIds = questions.map(q => q.questionId);
  const duplicateIds = questionIds.filter((id, i) => questionIds.indexOf(id) !== i);
  
  if (duplicateIds.length > 0) {
    result.globalIssues.push({
      severity: 'CRITICAL',
      code: 'DUPLICATE_IDS',
      field: 'questionId',
      message: `Found ${duplicateIds.length} duplicate question IDs: ${[...new Set(duplicateIds)].join(', ')}`
    });
  }
  
  return result;
}

export default validateQuestion;