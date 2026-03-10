import type { DirectedGraphEdge, GraphModel } from './types';

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
