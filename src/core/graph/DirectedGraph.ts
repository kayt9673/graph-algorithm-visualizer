import type { GraphModel, GraphNode } from './types';
import { DirectedEdge, type DirectedEdgeInit } from './DirectedEdge';

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
   * Adds `edge` to this graph. 
   */
  addEdge(edge: TEdge): void {
    this.edges.push(edge);
  }

  /**
   * Returns all edges in this graph whose source node is `nodeId`.
   */
  getEdgesFrom(nodeId: string): TEdge[] {
    return this.edges.filter((edge) => edge.source === nodeId);
  }

  /**
   * Returns all edges in this graph whose target node is `nodeId`.
   */
  getEdgesTo(nodeId: string): TEdge[] {
    return this.edges.filter((edge) => edge.target === nodeId);
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

  /**
   * Converts `graph` to a `DirectedGraph`.
   */
  static fromExampleGraph(graph: GraphModel): DirectedGraph {
    const edges = graph.edges.map(
      (edge) =>
        new DirectedEdge({
          id: edge.data.id,
          source: edge.data.source,
          target: edge.data.target,
          label: edge.data.label,
          classes: edge.classes,
        } satisfies DirectedEdgeInit),
    );

    return new DirectedGraph({
      name: graph.name,
      nodes: graph.nodes,
      edges,
    });
  }
}
