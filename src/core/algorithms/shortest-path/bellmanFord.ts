import type { ShortestPathGraph } from '../../graph/types';
import type { Snapshot } from '../../steps/types';
import { containsNode } from '../../graph/utils';
import { initPath, pushSnapshot, type ShortestPathResult } from './utils';

export interface BellmanFordSnapshot extends Snapshot {
  /** The source node. */
  source: string;
  /** The edge inspected at this step. */
  inspectedEdge?: {
    from: string;
    to: string;
    weight: number;
  };
  /** A map of the node IDs to their current shortest distance. */
  distances: Record<string, number>;
  /** A map of the node IDs to their backpointer (if any). */
  previous: Record<string, string | null>;
}

export interface BellmanFordResult extends ShortestPathResult<BellmanFordSnapshot> {
  hasNegativeCycle: boolean;
  negativeCycleNodes: string[];
}

/**
 * Runs the Bellman-Ford algorithm on `graph` starting from `source`.
 * Returns whether or not `graph` contains a negative cycle, snapshots of each iteration, 
 * the final distances from `source`, and backpointers. 
 */
export function runBellmanFord(graph: ShortestPathGraph, source: string): BellmanFordResult {
  containsNode(graph, source);

  const snapshots: BellmanFordSnapshot[] = [];
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  
  initPath(graph, distances, previous);
  distances[source] = 0;
  
  let iteration = 0;

  pushSnapshot(snapshots, {
    iteration,
    source,
    distances,
    previous,
  });

  let pass = 0;
  while (pass < graph.nodes.length - 1) {
    let updated = false;

    for (const edge of graph.edges) {
      const u = edge.data.source;
      const v = edge.data.target;
      const weight = edge.data.weight;

      if (distances[u] !== Number.POSITIVE_INFINITY && distances[u] + weight < distances[v]) {
        distances[v] = distances[u] + weight;
        previous[v] = u;
        updated = true;
      }

      iteration += 1;
      pushSnapshot(snapshots, {
        iteration,
        source,
        inspectedEdge: {
          from: u,
          to: v,
          weight,
        },
        distances,
        previous,
      });
    }

    // Early convergence
    if (!updated) {
      break;
    }

    pass += 1;
  }

  // Check for negative cycles and extract one cycle (if present).
  let hasNegativeCycle = false;
  let cycleSeed: string | null = null;

  for (const edge of graph.edges) {
    const u = edge.data.source;
    const v = edge.data.target;
    const weight = edge.data.weight;
    if (distances[u] !== Number.POSITIVE_INFINITY && distances[u] + weight < distances[v]) {
      hasNegativeCycle = true;
      cycleSeed = v;
      break;
    }
  }

  const negativeCycleNodes: string[] = [];
  if (hasNegativeCycle && cycleSeed) {
    let x: string | null = cycleSeed;

    // Move inside the cycle.
    for (let i = 0; i < graph.nodes.length; i += 1) {
      if (!x) break;
      x = previous[x];
    }

    if (x) {
      const cycle: string[] = [];
      const seen = new Set<string>();
      let cur: string | null = x;

      while (cur && !seen.has(cur)) {
        seen.add(cur);
        cycle.push(cur);
        cur = previous[cur];
      }

      if (cur) {
        const startIdx = cycle.indexOf(cur);
        if (startIdx >= 0) {
          const core = cycle.slice(startIdx).reverse();
          negativeCycleNodes.push(...core, core[0]);
        }
      }
    }
  }

  return {
    hasNegativeCycle,
    negativeCycleNodes,
    snapshots,
    distances,
    previous,
  };
}
