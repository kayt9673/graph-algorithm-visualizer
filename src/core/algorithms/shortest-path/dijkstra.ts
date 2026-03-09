import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import type { ShortestPathGraph } from '../../graph/types';
import type { Snapshot } from '../../steps/types';
import { getIncidentEdges } from '../../graph/utils';

export interface DijkstraSnapshot extends Snapshot {
  /** The source node. */
  source: string;
  current: string | null;
  /** The nodes currently in the frontier. */
  frontier: string[];
  /** The nodes that are settled (i.e. their shortest distance is final) */
  discovered: string[];
  /** A map of the node IDs to their current shortest distance. */
  distances: Record<string, number>;
  /** A map of the node IDs to their backpointer (if any). */
  previous: Record<string, string | null>;
}

export interface ShortestPathResult {
  snapshots: DijkstraSnapshot[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
}

/**
 * Runs Dijkstra's algorithm on `graph` starting from `source`.
 * Returns snapshots of each iteration, the final distances from `source`, and backpointers. 
 */
export function runDijkstra(graph: ShortestPathGraph, source: string): ShortestPathResult {
  const hasSource = graph.nodes.some((node) => node.data.id === source);
  if (!hasSource) {
    throw new Error(`Source node "${source}" not found in graph.`);
  }

  const snapshots: DijkstraSnapshot[] = [];
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  // Initialize all distances to infinity 
  for (const node of graph.nodes) {
    distances[node.data.id] = Number.POSITIVE_INFINITY;
    previous[node.data.id] = null;
  }
  distances[source] = 0;

  let iteration = 0;
  const discovered = new Set<string>();
  const frontier = new MinPriorityQueue<{ node: string; dist: number }>({
    compare: (a, b) => a.dist - b.dist,
  });
  frontier.enqueue({ node: source, dist: 0 });

  // Helper to push each snapshot 
  const pushSnapshot = (current: string | null) => {
    snapshots.push({
      iteration,
      source,
      current,
      frontier: frontier.toArray().map((item) => item.node),
      discovered: [...discovered],
      distances: { ...distances },
      previous: { ...previous },
    });
  };

  pushSnapshot(source);

  while(!frontier.isEmpty()) {
    const cur = frontier.dequeue();
    if (!cur) break;

    const { node: u, dist } = cur;
    if (dist !== distances[u]) continue;

    if (!discovered.has(u)) {
      discovered.add(u);
      
      for (const edge of getIncidentEdges(graph, u)) {
        const v = edge.data.target;
        const weight = edge.data.weight;

        if (weight < 0) {
          throw new Error('Non-negative edge weights only.');
        }

        const curDist = distances[u] + weight;
        if (curDist < distances[v]) {
          distances[v] = curDist;
          previous[v] = u;
          frontier.enqueue({ node: v, dist: curDist});
        }
      }
    }

    iteration += 1;
    pushSnapshot(u);
  }

  return {
    snapshots,
    distances,
    previous,
  };
}
