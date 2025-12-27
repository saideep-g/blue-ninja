// Question Types and Interfaces for Blue Ninja v2.0

export type QuestionTemplate = 
  | 'MCQ_CONCEPT'
  | 'TWO_TIER'
  | 'NUMERIC_INPUT'
  | 'EXPRESSION_INPUT'
  | 'WORKED_EXAMPLE_COMPLETE'
  | 'STEP_ORDER'
  | 'ERROR_ANALYSIS'
  | 'CLASSIFY_SORT'
  | 'NUMBER_LINE_PLACE'
  | 'MATCHING'
  | 'BALANCE_OPS'
  | 'GEOMETRY_TAP'
  | 'MULTI_STEP_WORD'
  | 'SIMULATION'
  | 'SHORT_EXPLAIN';

export type ScoringModel = 
  | 'exact' 
  | 'tolerance' 
  | 'equivalence' 
  | 'order' 
  | 'set_membership' 
  | 'process'
  | 'rubric_lite';

export interface Question {
  item_id: string;
  atom_id: string;
  template_id: QuestionTemplate;
  difficulty: number;
  prompt: {
    text: string;
    latex?: string;
  };
  instruction: string;
  stimulus?: {
    text?: string;
    diagram?: string;
    data?: any;
  };
  interaction: {
    type: string;
    config: any;
  };
  answer_key: any;
  scoring: {
    model: ScoringModel;
    params?: any;
  };
  worked_solution: {
    steps: string[];
    final_answer: string;
    why_it_works?: string;
  };
  misconceptions?: Array<{
    category: string;
    tag: string;
    symptom: string;
    hint: string;
  }>;
  feedback_map?: {
    on_correct?: string;
    on_incorrect_attempt_1?: string;
    on_incorrect_attempt_2?: string;
  };
  transfer_item?: any;
}

export interface QuestionResponse {
  item_id: string;
  answer: any;
  isCorrect: boolean;
  feedback: string;
  attempt: number;
  time_taken_seconds: number;
}

export interface Atom {
  atom_id: string;
  title: string;
  core_idea: string;
  learning_objectives: string[];
  representations: string[];
  prerequisites: string[];
  common_misconceptions: string[];
  vocabulary: string[];
  tags: string[];
}

export interface Module {
  module_id: string;
  title: string;
  domain: string;
  big_ideas: string[];
  estimated_sessions: number;
  atoms: Atom[];
}

export interface Curriculum {
  schema_version: string;
  id: string;
  title: string;
  created_at: string;
  language: string;
  grade_level: string;
  age_range: [number, number];
  design_goals: string[];
  modules: Module[];
  mastery_model: {
    levels: Array<{ level: string; definition: string }>;
  };
}

export interface StudentProgress {
  atom_id: string;
  mastery_level: 'ACQUIRE' | 'SECURE' | 'FLUENT' | 'TRANSFER';
  accuracy: number;
  items_attempted: number;
  last_attempted: string;
  next_review: string;
}
