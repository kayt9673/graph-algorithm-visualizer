export type AppState = 'empty' | 'editing' | 'running' | 'finished';

export interface GraphNode {
  data: { id: string; label: string };
  classes?: string;
}

export interface DirectedGraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    capacity?: number;
    flow?: number;
    label?: string;
  };
  classes?: string;
}

export interface UndirectedGraphEdge {
  data: {
    id: string;
    a: string;
    b: string;
    label?: string;
  };
  classes?: string;
}

export type AnyGraphEdge = DirectedGraphEdge | UndirectedGraphEdge;
export type GraphEdge = DirectedGraphEdge;
export type GraphElement = GraphNode | GraphEdge;

/**
 * Generic graph used by the app shell/editor. 
 */
export interface GraphModel<TEdge extends AnyGraphEdge = DirectedGraphEdge> {
  name: string;
  nodes: GraphNode[];
  edges: TEdge[];
  directed?: boolean;
}

/**
 * Flow-network graph for max-flow algorithms.
 */
export interface FlowNetworkGraph extends GraphModel<DirectedGraphEdge> {
  source: string;
  sink: string;
}
