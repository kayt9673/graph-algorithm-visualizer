export type AppState = 'empty' | 'editing' | 'running' | 'finished';

export interface GraphNode {
  data: { id: string; label: string };
  classes?: string;
}

export interface GraphEdge {
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

export type GraphElement = GraphNode | GraphEdge;

export interface ExampleGraph {
  name: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  source: string;
  sink: string;
}
