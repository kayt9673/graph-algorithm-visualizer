import type { GraphModel, GraphNode } from './types';
import { DirectedEdge } from './DirectedEdge';

export interface DirectedGraphInit<TEdge extends DirectedEdge = DirectedEdge> {
  name: string;
  nodes: GraphNode[];
  edges?: TEdge[];
}

/**
 * A directed graph. 
 */
export class DirectedGraph<TEdge extends DirectedEdge = DirectedEdge> {
  /** The name of the graph. */
  public name: string;
  /** A list of the nodes in the graph. */
  public nodes: GraphNode[];
  /** A list of the edges in the graph. */
  public edges: TEdge[];

  constructor(init: DirectedGraphInit<TEdge>) {
    this.name = init.name;
    this.nodes = init.nodes.map((node) => ({ ...node, data: { ...node.data } }));
    this.edges = init.edges ?? [];
  }

  /**
   * Converts this graph to a `GraphModel`.
   */
  toExampleGraph(): GraphModel {
    return {
      name: this.name,
      nodes: this.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: this.edges.map((edge) => edge.toGraphEdge()),
      directed: true,
    };
  }

}
