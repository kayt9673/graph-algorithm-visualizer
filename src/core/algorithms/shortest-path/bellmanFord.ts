import type { ShortestPathGraph } from '../../graph/types';
import type { ShortestPathResult } from './dijkstra';

export interface BellmanFordResult extends ShortestPathResult {
  hasNegativeCycle: boolean;
}

export function runBellmanFord(graph: ShortestPathGraph): BellmanFordResult {
  void graph;
  throw new Error();
}
