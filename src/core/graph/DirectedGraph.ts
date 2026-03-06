import type { GraphModel, GraphNode } from './types';
import { DirectedEdge, type DirectedEdgeInit } from './DirectedEdge';

export interface DirectedGraphInit<TEdge extends DirectedEdge = DirectedEdge> {
  name: string;
  nodes: GraphNode[];
  edges?: TEdge[];
}

export class DirectedGraph<TEdge extends DirectedEdge = DirectedEdge> {
  public name: string;
  public nodes: GraphNode[];
  public edges: TEdge[];

  constructor(init: DirectedGraphInit<TEdge>) {
    this.name = init.name;
    this.nodes = init.nodes.map((node) => ({ ...node, data: { ...node.data } }));
    this.edges = init.edges ?? [];
  }

  addEdge(edge: TEdge): void {
    this.edges.push(edge);
  }

  getEdgesFrom(nodeId: string): TEdge[] {
    return this.edges.filter((edge) => edge.source === nodeId);
  }

  getEdgesTo(nodeId: string): TEdge[] {
    return this.edges.filter((edge) => edge.target === nodeId);
  }

  toExampleGraph(): GraphModel {
    return {
      name: this.name,
      nodes: this.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: this.edges.map((edge) => edge.toGraphEdge()),
      directed: true,
    };
  }

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
