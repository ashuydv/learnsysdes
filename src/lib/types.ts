export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface ProblemRequirements {
  functional: string[];
  nonFunctional: string[];
}

export interface EstimationField {
  key: string;
  label: string;
  unit?: string;
  defaultValue?: number;
}
