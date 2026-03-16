/**
 * The app's different UI phases.
 * 'editing': Setting up or viewing the graph before execution of algorithm.
 * `running`: The algorithm is currently running (manually or automatically).
 * `finished`: The algorithm is finished running. 
 */
export type AppState = 'editing' | 'running' | 'finished';

/**
 * A node containing `data` and an optional style class used for styling in Cytoscape.
 */
export interface GraphNode {
  data: { id: string; label: string };
  classes?: string;
}

/**
 * A directed edge containing `data` and an optional style class used for styling in Cytoscape.
 */
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

/**
 * An undirected edge containing `data` and an optional style class used for styling in Cytoscape.
 */
export interface UndirectedGraphEdge {
  data: {
    id: string;
    u: string;
    v: string;
    label?: string;
  };
  classes?: string;
}

/**
 * Union of edge and graph variants.
 */
export type AnyGraphEdge = DirectedGraphEdge | UndirectedGraphEdge;

export type GraphEdge = DirectedGraphEdge;

export type GraphElement = GraphNode | GraphEdge;

/**
 * A generic graph model used by the app. 
 */
export interface GraphModel<TEdge extends AnyGraphEdge = DirectedGraphEdge> {
  name: string;
  nodes: GraphNode[];
  edges: TEdge[];
  directed?: boolean;
}

/**
 * A flow network graph model. 
 */
export interface FlowNetworkGraph extends GraphModel<DirectedGraphEdge> {
  source: string;
  sink: string;
}

/**
 * Dijkstra's: Non-negative edge weights.
 * Bellman-Ford: No negative cycles.
 */
export type ShortestPathAlgorithm = 'dijkstra' | 'bellman-ford';

/**
 * A weighted directed edge containing `data` and `weight`.
 */
export interface WeightedDirectedEdge extends DirectedGraphEdge {
  data: DirectedGraphEdge['data'] & {
    weight: number;
  };
}

/**
 * A shortest path graph model. 
 */
export interface ShortestPathGraph extends GraphModel<WeightedDirectedEdge> {
  source: string;
}

/**
 * A connected graph for running MST algorithms. 
 */
export interface MSTGraph extends GraphModel<UndirectedGraphEdge> {
  source?: string;
}
