import type { AnyGraphEdge, GraphModel, GraphNode } from './types';
import { DirectedEdge, UndirectedEdge } from './Edge';

type GraphLikeEdge = {
  toGraphEdge(): AnyGraphEdge;
};

export interface GraphInit<TEdge extends GraphLikeEdge = GraphLikeEdge> {
  name: string;
  nodes: GraphNode[];
  edges?: TEdge[];
}

export type DirectedGraphInit<TEdge extends DirectedEdge = DirectedEdge> = GraphInit<TEdge>;
export type UndirectedGraphInit<TEdge extends UndirectedEdge = UndirectedEdge> = GraphInit<TEdge>;

/**
 * A generic graph base class shared by directed and undirected graph variants.
 */
export class Graph<TEdge extends GraphLikeEdge = GraphLikeEdge> {
  /** The name of the graph. */
  public name: string;
  /** A list of the nodes in the graph. */
  public nodes: GraphNode[];
  /** A list of the edges in the graph. */
  public edges: TEdge[];
  /** Whether this graph is directed. */
  protected readonly directed: boolean;

  constructor(init: GraphInit<TEdge>, directed: boolean) {
    this.name = init.name;
    this.nodes = init.nodes.map((node) => ({ ...node, data: { ...node.data } }));
    this.edges = init.edges ?? [];
    this.directed = directed;
  }

  /**
   * Converts this graph to a `GraphModel`.
   */
  toExampleGraph(): GraphModel {
    return {
      name: this.name,
      nodes: this.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: this.edges.map((edge) => edge.toGraphEdge()),
      directed: this.directed,
    };
  }
}

/**
 * A directed graph.
 */
export class DirectedGraph<TEdge extends DirectedEdge = DirectedEdge> extends Graph<TEdge> {
  constructor(init: DirectedGraphInit<TEdge>) {
    super(init, true);
  }
}

/**
 * An undirected graph.
 */
export class UndirectedGraph<TEdge extends UndirectedEdge = UndirectedEdge> extends Graph<TEdge> {
  constructor(init: UndirectedGraphInit<TEdge>) {
    super(init, false);
  }
}
