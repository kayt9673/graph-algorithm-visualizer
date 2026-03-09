import type { DirectedGraphEdge, GraphModel } from './types';

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
