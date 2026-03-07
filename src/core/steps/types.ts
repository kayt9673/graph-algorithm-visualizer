import type { GraphElement } from '../graph/types';

/**
 * Visualizes one step in the corresponding algorithm. 
 */
export interface AlgorithmStep {
  id: number;
  title: string;
  description: string;
  elements: GraphElement[];
}

/**
 * Visualizes one step in a max-flow algorithm. 
 */
export interface MaxFlowAlgorithmStep extends AlgorithmStep {
  residualElements?: GraphElement[];
  currentFlow?: number;
  flowDelta?: number;
  bottleneck?: number;
  path?: string[];
  totalMaxFlow?: number;
}
