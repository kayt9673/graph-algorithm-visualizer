import { DirectedGraph } from '../../graph/Graph';
import type { FlowNetworkGraph } from '../../graph/types';
import { MaxFlowEdge } from './MaxFlowEdge';

interface MaxFlowGraphInit {
  name: string;
  nodes: FlowNetworkGraph['nodes'];
  edges: MaxFlowEdge[];
  source: string;
  sink: string;
}

/**
 * A directed graph used specifically for maximum flow networks. 
 */
export class MaxFlowGraph extends DirectedGraph<MaxFlowEdge> {

  /** The ID of the source node s. */
  source: string;
  /** The ID of the sink node t. */
  sink: string;

  constructor(init: MaxFlowGraphInit) {
    super(init);
    this.source = init.source;
    this.sink = init.sink;
  }

  /**
   * Converts a `FlowNetworkGraph` to a `MaxFlowGraph`.
   */
  static fromExampleGraph(graph: FlowNetworkGraph): MaxFlowGraph {
    const edges = graph.edges.map(
      (edge) =>
        new MaxFlowEdge({
          id: edge.data.id,
          source: edge.data.source,
          target: edge.data.target,
          label: edge.data.label,
          classes: edge.classes,
          capacity: edge.data.capacity ?? 0,
          flow: edge.data.flow ?? 0,
        }),
    );

    return new MaxFlowGraph({
      name: graph.name,
      nodes: graph.nodes,
      edges,
      source: graph.source,
      sink: graph.sink,
    });
  }

  /**
   * Converts this graph to a `FlowNetworkGraph`.
   */
  override toExampleGraph(): FlowNetworkGraph {
    return {
      name: this.name,
      nodes: this.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: this.edges.map((edge) => edge.toGraphEdge()),
      directed: true,
      source: this.source,
      sink: this.sink,
    };
  }

  /**
   * Creates a copy of this graph.
   */
  clone(): MaxFlowGraph {
    return new MaxFlowGraph({
      name: this.name,
      nodes: this.nodes.map((node) => ({ ...node, data: { ...node.data } })),
      edges: this.edges.map((edge) => edge.clone()),
      source: this.source,
      sink: this.sink,
    });
  }
}
