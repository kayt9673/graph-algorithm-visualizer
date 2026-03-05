import type { GraphElement } from '../graph/types';

export interface AlgorithmStep {
  id: number;
  title: string;
  description: string;
  currentFlow?: number;
  bottleneck?: number;
  path?: string[];
  totalMaxFlow?: number;
  elements: GraphElement[];
}
