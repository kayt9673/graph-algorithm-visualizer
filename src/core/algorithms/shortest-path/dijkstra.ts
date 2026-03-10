import { MinPriorityQueue } from '@datastructures-js/priority-queue';
import type { ShortestPathGraph } from '../../graph/types';
import type { BellmanFordSnapshot } from './bellmanFord';
import { getIncidentEdges, containsNode } from '../../graph/utils';

export interface DijkstraSnapshot extends BellmanFordSnapshot {
  /** The current node that is being processed. */
  current: string | null;
  /** The nodes currently in the frontier. */
  frontier: string[];
  /** The nodes that are settled (i.e. their shortest distance is final) */
  discovered: string[];
}

export interface ShortestPathResult {
  snapshots: DijkstraSnapshot[] | BellmanFordSnapshot[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
}

/**
 * Pushes a shortest-path snapshot while cloning mutable map/array fields.
 */
export function pushSnapshot(
  snapshots: Array<BellmanFordSnapshot | DijkstraSnapshot>,
  snapshot: BellmanFordSnapshot | DijkstraSnapshot,
): void {
  snapshots.push({
    ...snapshot,
    distances: { ...snapshot.distances },
    previous: { ...snapshot.previous },
    ...('frontier' in snapshot ? { frontier: [...snapshot.frontier] } : {}),
    ...('discovered' in snapshot ? { discovered: [...snapshot.discovered] } : {}),
  });
}

/**
 * Initializes the starting distances of all nodes in `graph` to infinity and their
 * backpointer to `null`.
 */
export function initPath(
  graph: ShortestPathGraph, 
  distances: Record<string, number>, 
  previous: Record<string, string | null>
) {
  for (const node of graph.nodes) {
      distances[node.data.id] = Number.POSITIVE_INFINITY;
      previous[node.data.id] = null;
    }
}

/**
 * Runs Dijkstra's algorithm on `graph` starting from `source`.
 * Returns snapshots of each iteration, the final distances from `source`, and backpointers. 
 */
export function runDijkstra(graph: ShortestPathGraph, source: string): ShortestPathResult {
  containsNode(graph, source);

  const snapshots: DijkstraSnapshot[] = [];
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};

  initPath(graph, distances, previous);
  distances[source] = 0;

  let iteration = 0;
  const discovered = new Set<string>();
  const frontier = new MinPriorityQueue<{ node: string; dist: number }>({
    compare: (a, b) => a.dist - b.dist,
  });
  frontier.enqueue({ node: source, dist: 0 });

  pushSnapshot(snapshots, {
    iteration,
    source,
    current: source,
    frontier: frontier.toArray().map((item) => item.node),
    discovered: [...discovered],
    distances,
    previous,
  });

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
    pushSnapshot(snapshots, {
      iteration,
      source,
      current: u,
      frontier: frontier.toArray().map((item) => item.node),
      discovered: [...discovered],
      distances,
      previous,
    });
  }

  return {
    snapshots,
    distances,
    previous,
  };
}
