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

/**
 * Visualizes one step in a shortest-path algorithm.
 */
export interface ShortestPathAlgorithmStep extends AlgorithmStep {
  source: string;
  nodeLabels: Record<string, string>;
  current: string | null;
  frontier: string[];
  discovered: string[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  distanceChanges?: Array<{
    from: string;
    to: string;
    baseDistance: number;
    weight: number;
    candidate: number;
    previousDistance: number;
    nextDistance: number;
    updated: boolean;
  }>;
}

/**
 * Snapshot captured after each successful iteration.
 */
export interface Snapshot {
  /** The iteration that the snapshot represents. */
  iteration: number;
  /** A list of nodes found in the current path. */
  path?: string[];
}
