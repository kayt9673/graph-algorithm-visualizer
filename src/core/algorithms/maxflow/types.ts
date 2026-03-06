import type { FlowNetworkGraph } from '../../graph/types';
import { MaxFlowEdge } from './MaxFlowEdge';
import { MaxFlowGraph } from './MaxFlowGraph';

/**
 * `MaxFlowEdge`: A directed edge with `capacity` and `flow`
 * `MaxFlowGraph`: A directed graph whose edges are `MaxFlowEdge`
 */
export { MaxFlowEdge, MaxFlowGraph };

/**
 * Formats edge labels as `flow`/`capacity` for UI display.
 */
export function formatFlowLabel(flow: number, capacity: number): string {
  return `${flow}/${capacity}`;
}

/**
 * Converts a flow-network graph into a `MaxFlowGraph`.
 */
export function toMaxFlowGraph(graph: FlowNetworkGraph): MaxFlowGraph {
  return MaxFlowGraph.fromExampleGraph(graph);
}
