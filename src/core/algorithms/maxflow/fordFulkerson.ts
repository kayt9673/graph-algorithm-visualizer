import type { FlowNetworkGraph } from '../../graph/types';
import { MaxFlowGraph } from './MaxFlowGraph';
import { MaxFlowEdge } from './MaxFlowEdge';
import { toMaxFlowGraph } from './types';

/**
 * Snapshot captured after each successful augmentation.
 */
export interface FordFulkersonSnapshot {
  /** The iteration that the snapshot represents. */
  iteration: number;
  /** The total flow value from the source to the sink during this snapshot. */
  totalFlow: number;
  /** A list of the nodes found in the s -> t augmenting path in the residual graph. */
  path?: string[];
  /** The minimum residual capacity along `path`. */
  bottleneck?: number;
  /** The residual graph during this snapshot. */
  residualGraph: MaxFlowGraph;
}

/**
 * Includes per-iteration snapshots, the final graph, and the maximum flow value. 
 */
export interface FordFulkersonResult {
  snapshots: FordFulkersonSnapshot[];
  finalGraph: MaxFlowGraph;
  maxFlow: number;
}

/**
 * Performs BFS on `_residual` to find an augmenting `_source` -> `_sink` path.
 * Returns a list of the nodes in this path if found, or null if no augmenting path exists.
 */
function bfsAugmentingPath(_residual: MaxFlowGraph, _source: string, _sink: string): string[] | null {
  const queue: string[] = [_source];
  const parent: Record<string, string | null> = {};
  const visited = new Set<string>();

  visited.add(_source);
  parent[_source] = null;

  while (queue.length) {
    const u = queue.shift()!;

    for (const edge of _residual.edges) {
      if (edge.source === u && edge.capacity > 0) {
        const v = edge.target;

        if (!visited.has(v)) {
          visited.add(v);
          parent[v] = u;
          queue.push(v);

          if (v === _sink) {
            const path: string[] = [];
            let cur: string | null = _sink;

            while (cur) {
              path.unshift(cur);
              cur = parent[cur] ?? null;
            }

            return path;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Returns the corresponding residual graph for `graph`.
 */
function buildResidualGraph(graph: MaxFlowGraph): MaxFlowGraph {
  const residualEdges: MaxFlowEdge[] = [];

  for (const edge of graph.edges) {
    const forwardResidual = edge.capacity - edge.flow;
    if (forwardResidual > 0) {
      residualEdges.push(
        new MaxFlowEdge({
          id: `${edge.id}:f`,
          source: edge.source,
          target: edge.target,
          capacity: forwardResidual,
          flow: 0,
        }),
      );
    }

    if (edge.flow > 0) {
      residualEdges.push(
        new MaxFlowEdge({
          id: `${edge.id}:b`,
          source: edge.target,
          target: edge.source,
          capacity: edge.flow,
          flow: 0,
        }),
      );
    }
  }

  return new MaxFlowGraph({
    name: `${graph.name} Residual`,
    nodes: graph.nodes,
    edges: residualEdges,
    source: graph.source,
    sink: graph.sink,
  });
}

/**
 * Computes the minimum residual capacity along `path` in `residual`.
 */
function findPathBottleneck(residual: MaxFlowGraph, path: string[]): number {
  let bottleneck = Number.POSITIVE_INFINITY;

  for (let i = 0; i < path.length - 1; i += 1) {
    const u = path[i];
    const v = path[i + 1];
    const edge = residual.edges.find((e) => e.source === u && e.target === v);
    if (!edge) {
      throw new Error(`Residual edge missing for ${u} -> ${v}` path);
    }
    bottleneck = Math.min(bottleneck, edge.capacity);
  }

  return bottleneck;
}

/**
 * Applies one augmentation to the original flow values in `graph`.
 * If `path` is forward in the original graph, its flow value increases by `bottleneck`.
 * If `path` uses a residual back edge, its flow value decreases by `bottleneck`.
 */
function applyAugmentingPath(graph: MaxFlowGraph, path: string[], bottleneck: number): void {
  for (let i = 0; i < path.length - 1; i += 1) {
    const u = path[i];
    const v = path[i + 1];

    const forward = graph.edges.find((e) => e.source === u && e.target === v);
    if (forward) {
      forward.addFlow(bottleneck);
      continue;
    }

    const backward = graph.edges.find((e) => e.source === v && e.target === u);
    if (!backward) {
      throw new Error(`No matching graph edge for ${u} -> ${v}` path);
    }
    backward.addFlow(-bottleneck);
  }
}

/**
 * Runs the Ford-Fulkerson algorithm using the Edmonds-Karp implmementation.
 * Returns snapshots of each iteration, the final graph, and the max-flow value. 
 */
export function runFordFulkerson(graph: FlowNetworkGraph): FordFulkersonResult {
  const workingGraph = toMaxFlowGraph(graph);
  const snapshots: FordFulkersonSnapshot[] = [];
  let totalFlow = 0;
  let iteration = 0;

  while (true) {
    const residual = buildResidualGraph(workingGraph);
    const path = bfsAugmentingPath(residual, workingGraph.source, workingGraph.sink);

    if (!path) break;

    iteration += 1;
    const bottleneck = findPathBottleneck(residual, path);
    applyAugmentingPath(workingGraph, path, bottleneck);
    totalFlow += bottleneck;

    snapshots.push({
      iteration,
      totalFlow,
      path,
      bottleneck,
      residualGraph: buildResidualGraph(workingGraph),
    });
  }

  return {
    snapshots,
    finalGraph: workingGraph,
    maxFlow: totalFlow,
  };
}
