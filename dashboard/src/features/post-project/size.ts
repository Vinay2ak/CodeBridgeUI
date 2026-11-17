export type ProjectSize = 'MICRO_BUG' | 'FEATURE_INTEGRATION' | 'COMPLEX_MODULE';

export interface ProjectSizeInfo {
  value: ProjectSize;
  label: string;
}

export function sizeFromBudget(budget: number): ProjectSizeInfo {
  if (budget < 3000) {
    return {
      value: 'MICRO_BUG',
      label: 'Micro-bug',
    };
  }
  if (budget <= 7500) {
    return {
      value: 'FEATURE_INTEGRATION',
      label: 'Feature or integration',
    };
  }
  return {
    value: 'COMPLEX_MODULE',
    label: 'Complex module',
  };
}
