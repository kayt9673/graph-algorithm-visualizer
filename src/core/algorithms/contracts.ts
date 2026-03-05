import type { ExampleGraph } from '../graph/types';
import type { AlgorithmStep } from '../steps/types';

export interface AlgorithmRunResult {
  steps: AlgorithmStep[];
  finalState: ExampleGraph;
  metrics?: Record<string, number>;
}

export type AlgorithmRunner = (graph: ExampleGraph) => AlgorithmRunResult;
