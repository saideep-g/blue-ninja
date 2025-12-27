/**
 * TemplateRouter.jsx
 * 
 * Universal template router component.
 * Dynamically renders the correct template component based on templateId.
 * 
 * Supports 15+ templates:
 * - MCQ_CONCEPT, MCQ_SKILL
 * - NUMERIC_INPUT
 * - BALANCE_OPS, BALANCE_SLIDER
 * - NUMBER_LINE_PLACE
 * - CLASSIFY_SORT
 * - MATCHING
 * - GEOMETRY_TAP
 * - ERROR_ANALYSIS
 * - WORKED_EXAMPLE_COMPLETE
 * - STEP_BUILDER, STEP_ORDER
 * - EXPRESSION_INPUT
 * - MULTI_STEP_WORD
 * - SIMULATION
 * - SHORT_EXPLAIN
 * - TRANSFER_MINI (NEW)
 * - DRAG_DROP_MATCH (NEW)
 * - GRAPH_PLOT (NEW)
 * - TWO_TIER
 */

import React, { useMemo } from 'react';
import { AlertCircle } from 'lucide-react';

// Import all template components
import { MCQTemplate } from './MCQTemplate';
import { NumericInputTemplate } from './NumericInputTemplate';
import { TwoTierTemplate } from './TwoTierTemplate';
import { ExpressionInputTemplate } from './ExpressionInputTemplate';
import { WorkedExampleTemplate } from './WorkedExampleTemplate';
import { StepOrderTemplate } from './StepOrderTemplate';
import { ErrorAnalysisTemplate } from './ErrorAnalysisTemplate';
import { ClassifySortTemplate } from './ClassifySortTemplate';
import { NumberLineTemplate } from './NumberLineTemplate';
import { MatchingTemplate } from './MatchingTemplate';
import { BalanceOpsTemplate } from './BalanceOpsTemplate';
import { GeometryTapTemplate } from './GeometryTapTemplate';
import { MultiStepWordTemplate } from './MultiStepWordTemplate';
import { SimulationTemplate } from './SimulationTemplate';
import { ShortExplainTemplate } from './ShortExplainTemplate';

/**
 * Template Registry
 * Maps template IDs to component implementations
 */
const TEMPLATE_REGISTRY = {
  // MCQ variants
  'MCQ_CONCEPT': MCQTemplate,
  'MCQ_SKILL': MCQTemplate,
  'TWO_TIER': TwoTierTemplate,
  
  // Numeric input
  'NUMERIC_INPUT': NumericInputTemplate,
  
  // Balance operations
  'BALANCE_OPS': BalanceOpsTemplate,
  'BALANCE_SLIDER': BalanceOpsTemplate,
  
  // Spatial/visual
  'NUMBER_LINE_PLACE': NumberLineTemplate,
  'GEOMETRY_TAP': GeometryTapTemplate,
  'GRAPH_PLOT': NumberLineTemplate, // Reuse NumberLineTemplate for graphs
  
  // Classification
  'CLASSIFY_SORT': ClassifySortTemplate,
  'MATCHING': MatchingTemplate,
  'DRAG_DROP_MATCH': MatchingTemplate,
  
  // Analysis
  'ERROR_ANALYSIS': ErrorAnalysisTemplate,
  'WORKED_EXAMPLE_COMPLETE': WorkedExampleTemplate,
  
  // Multi-step
  'STEP_BUILDER': StepOrderTemplate,
  'STEP_ORDER': StepOrderTemplate,
  'MULTI_STEP_WORD': MultiStepWordTemplate,
  
  // Expression
  'EXPRESSION_INPUT': ExpressionInputTemplate,
  
  // Interactive
  'SIMULATION': SimulationTemplate,
  
  // Reflection
  'SHORT_EXPLAIN': ShortExplainTemplate,
  'TRANSFER_MINI': ShortExplainTemplate // Reuse ShortExplainTemplate
};

/**
 * TemplateRouter Component
 * 
 * Props:
 * - question: Question object with templateId and template-specific data
 * - onSubmit: Callback when answer is submitted
 * - isSubmitting: Loading state
 * - readOnly: Disable input (for review)
 */
export function TemplateRouter({ question, onSubmit, isSubmitting = false, readOnly = false }) {
  // Get template component
  const TemplateComponent = useMemo(() => {
    if (!question?.templateId) return null;
    return TEMPLATE_REGISTRY[question.templateId] || null;
  }, [question?.templateId]);

  // Debug info
  const templateInfo = useMemo(() => {
    return {
      templateId: question?.templateId,
      supported: !!TemplateComponent,
      atomId: question?.atomId,
      phase: question?.phase,
      slot: question?.slot
    };
  }, [question, TemplateComponent]);

  // Log template routing
  React.useEffect(() => {
    if (question?.templateId) {
      console.log('[TemplateRouter]', {
        templateId: question.templateId,
        atomId: question.atomId,
        phase: question.phase,
        supported: !!TemplateComponent,
        availableTemplates: Object.keys(TEMPLATE_REGISTRY).length
      });
    }
  }, [question?.templateId, question?.atomId, question?.phase, TemplateComponent]);

  // Error state: template not found
  if (!TemplateComponent) {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 flex gap-4">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="font-semibold text-red-900">Template Not Found</h3>
          <p className="text-red-700 mt-1">Template ID: <code className="bg-red-100 px-2 py-1 rounded">{question?.templateId}</code></p>
          <p className="text-red-700 text-sm mt-2">Available templates: {Object.keys(TEMPLATE_REGISTRY).join(', ')}</p>
          <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded font-mono overflow-auto max-h-24">
            {JSON.stringify(templateInfo, null, 2)}
          </div>
        </div>
      </div>
    );
  }

  // Render template component
  return (
    <TemplateComponent
      question={question}
      onSubmit={onSubmit}
      isSubmitting={isSubmitting}
      readOnly={readOnly}
    />
  );
}

/**
 * Get template component by ID
 * Utility function for programmatic access
 */
export function getTemplateComponent(templateId) {
  return TEMPLATE_REGISTRY[templateId] || null;
}

/**
 * Get all supported template IDs
 */
export function getSupportedTemplates() {
  return Object.keys(TEMPLATE_REGISTRY);
}

/**
 * Check if template is supported
 */
export function isTemplateSupported(templateId) {
  return !!TEMPLATE_REGISTRY[templateId];
}

/**
 * Get template metadata
 */
export function getTemplateMetadata(templateId) {
  return {
    id: templateId,
    supported: isTemplateSupported(templateId),
    component: getTemplateComponent(templateId),
    category: categorizeTemplate(templateId)
  };
}

/**
 * Categorize templates by type
 */
function categorizeTemplate(templateId) {
  if (templateId.includes('MCQ') || templateId.includes('TWO_TIER')) return 'MULTIPLE_CHOICE';
  if (templateId.includes('NUMERIC')) return 'NUMERIC_INPUT';
  if (templateId.includes('BALANCE')) return 'BALANCE';
  if (templateId.includes('NUMBER_LINE') || templateId.includes('GRAPH')) return 'SPATIAL';
  if (templateId.includes('CLASSIFY') || templateId.includes('SORT') || templateId.includes('MATCHING')) return 'CLASSIFICATION';
  if (templateId.includes('ERROR')) return 'ANALYSIS';
  if (templateId.includes('STEP') || templateId.includes('MULTI_STEP')) return 'SEQUENCING';
  if (templateId.includes('EXPRESSION')) return 'SYMBOLIC';
  if (templateId.includes('GEOMETRY')) return 'GEOMETRY';
  if (templateId.includes('SIMULATION')) return 'SIMULATION';
  if (templateId.includes('EXPLAIN') || templateId.includes('TRANSFER')) return 'REFLECTION';
  return 'OTHER';
}

export default TemplateRouter;
