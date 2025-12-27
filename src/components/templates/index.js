// Export all template components
export { MCQTemplate } from './MCQTemplate';
export { NumericInputTemplate } from './NumericInputTemplate';
export { TwoTierTemplate } from './TwoTierTemplate';
export { ExpressionInputTemplate } from './ExpressionInputTemplate';
export { WorkedExampleTemplate } from './WorkedExampleTemplate';
export { StepOrderTemplate } from './StepOrderTemplate';
export { ErrorAnalysisTemplate } from './ErrorAnalysisTemplate';
export { ClassifySortTemplate } from './ClassifySortTemplate';
export { NumberLineTemplate } from './NumberLineTemplate';
export { MatchingTemplate } from './MatchingTemplate';
export { BalanceOpsTemplate } from './BalanceOpsTemplate';
export { GeometryTapTemplate } from './GeometryTapTemplate';
export { MultiStepWordTemplate } from './MultiStepWordTemplate';
export { SimulationTemplate } from './SimulationTemplate';
export { ShortExplainTemplate } from './ShortExplainTemplate';

/**
 * TemplateRouter - Dynamically routes to the correct template component
 */
export function getTemplateComponent(templateId) {
  const templates = {
    'MCQ_CONCEPT': MCQTemplate,
    'NUMERIC_INPUT': NumericInputTemplate,
    'TWO_TIER': TwoTierTemplate,
    'EXPRESSION_INPUT': ExpressionInputTemplate,
    'WORKED_EXAMPLE_COMPLETE': WorkedExampleTemplate,
    'STEP_ORDER': StepOrderTemplate,
    'ERROR_ANALYSIS': ErrorAnalysisTemplate,
    'CLASSIFY_SORT': ClassifySortTemplate,
    'NUMBER_LINE_PLACE': NumberLineTemplate,
    'MATCHING': MatchingTemplate,
    'BALANCE_OPS': BalanceOpsTemplate,
    'GEOMETRY_TAP': GeometryTapTemplate,
    'MULTI_STEP_WORD': MultiStepWordTemplate,
    'SIMULATION': SimulationTemplate,
    'SHORT_EXPLAIN': ShortExplainTemplate
  };
  return templates[templateId] || null;
}
