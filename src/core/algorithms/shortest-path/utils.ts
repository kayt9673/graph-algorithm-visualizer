import type { ShortestPathGraph } from '../../graph/types';
import type { Snapshot } from '../../steps/types';

export interface ShortestPathSnapshot extends Snapshot {
  source: string;
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  frontier?: string[];
  discovered?: string[];
}

export interface ShortestPathResult<TSnapshot extends ShortestPathSnapshot = ShortestPathSnapshot> {
  snapshots: TSnapshot[];
  distances: Record<string, number>;
  previous: Record<string, string | null>;
}

/**
 * Pushes a shortest-path snapshot while cloning mutable map/array fields.
 */
export function pushSnapshot<TSnapshot extends ShortestPathSnapshot>(
  snapshots: TSnapshot[],
  snapshot: TSnapshot,
): void {
  snapshots.push({
    ...snapshot,
    distances: { ...snapshot.distances },
    previous: { ...snapshot.previous },
    ...('frontier' in snapshot && snapshot.frontier ? { frontier: [...snapshot.frontier] } : {}),
    ...('discovered' in snapshot && snapshot.discovered ? { discovered: [...snapshot.discovered] } : {}),
  } as TSnapshot);
}

/**
 * Initializes the starting distances of all nodes in `graph` to infinity and their
 * backpointer to `null`.
 */
export function initPath(
  graph: ShortestPathGraph,
  distances: Record<string, number>,
  previous: Record<string, string | null>,
): void {
  for (const node of graph.nodes) {
    distances[node.data.id] = Number.POSITIVE_INFINITY;
    previous[node.data.id] = null;
  }
}
