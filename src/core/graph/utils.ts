import type { AnyGraphEdge, DirectedGraphEdge, GraphModel } from './types';

/** A map of node IDs to their neighbors. */
export type AdjList = Map<string, string[]>;

/**
 * Returns an adjacency list of the nodes in `graph`.
 */
export function buildAdjList(graph: GraphModel<AnyGraphEdge>): AdjList {
    const adj: AdjList = new Map();

    for (const node of graph.nodes) {
        adj.set(node.data.id, []);
    }

    for (const edge of graph.edges) {
        if ('source' in edge.data && 'target' in edge.data) {
            adj.get(edge.data.source)?.push(edge.data.target);
            continue;
        }

        if ('u' in edge.data && 'v' in edge.data) {
            adj.get(edge.data.u)?.push(edge.data.v);
            adj.get(edge.data.v)?.push(edge.data.u);
        }
    }

    return adj;
}

/**
 * Returns a list of the incident edges of `u` in `graph`.
 */
export function getIncidentEdges<TEdge extends DirectedGraphEdge>(
    graph: GraphModel<TEdge>, 
    u: string,
): TEdge[] {
    const edges: TEdge[] = [];

    for (const edge of graph.edges) {
        if (edge.data.source === u) {
            edges.push(edge);
        }
    }

    return edges;
}

/**
 * Returns whether or not `node` is in `graph`.
 */
export function containsNode(graph: GraphModel, node: string): void {
    const check = graph.nodes.some((u) => u.data.id === node);
    if (!check) {
        throw new Error(`Node "${node}" not found in graph.`);
    }
}
