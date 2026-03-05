import type { AlgorithmStep } from './types';

export function formatStepTitle(step: AlgorithmStep): string {
  return `Step ${step.id + 1}: ${step.title}`;
}
