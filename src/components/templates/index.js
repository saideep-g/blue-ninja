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

// Export router and utilities
export {
  TemplateRouter,
  getTemplateComponent,
  getSupportedTemplates,
  isTemplateSupported,
  getTemplateMetadata
} from './TemplateRouter';

/**
 * TemplateRouter - Dynamically routes to the correct template component
 * 
 * DEPRECATED: Use TemplateRouter component directly instead
 * This function is kept for backwards compatibility
 */
export function getTemplateComponentLegacy(templateId) {
  const templates = {
    'MCQ_CONCEPT': MCQTemplate,
    'MCQ_SKILL': MCQTemplate,
    'NUMERIC_INPUT': NumericInputTemplate,
    'TWO_TIER': TwoTierTemplate,
    'EXPRESSION_INPUT': ExpressionInputTemplate,
    'WORKED_EXAMPLE_COMPLETE': WorkedExampleTemplate,
    'STEP_ORDER': StepOrderTemplate,
    'STEP_BUILDER': StepOrderTemplate,
    'ERROR_ANALYSIS': ErrorAnalysisTemplate,
    'CLASSIFY_SORT': ClassifySortTemplate,
    'NUMBER_LINE_PLACE': NumberLineTemplate,
    'GRAPH_PLOT': NumberLineTemplate,
    'MATCHING': MatchingTemplate,
    'DRAG_DROP_MATCH': MatchingTemplate,
    'BALANCE_OPS': BalanceOpsTemplate,
    'BALANCE_SLIDER': BalanceOpsTemplate,
    'GEOMETRY_TAP': GeometryTapTemplate,
    'MULTI_STEP_WORD': MultiStepWordTemplate,
    'SIMULATION': SimulationTemplate,
    'SHORT_EXPLAIN': ShortExplainTemplate,
    'TRANSFER_MINI': ShortExplainTemplate
  };
  return templates[templateId] || null;
}
