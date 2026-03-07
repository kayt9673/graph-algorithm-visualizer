import type { FlowNetworkGraph } from '../../graph/types';
import { MaxFlowEdge } from './MaxFlowEdge';
import { MaxFlowGraph } from './MaxFlowGraph';

/**
 * `MaxFlowEdge`: A directed edge with `capacity` and `flow`
 * `MaxFlowGraph`: A directed graph whose edges are `MaxFlowEdge`
 */
export { MaxFlowEdge, MaxFlowGraph };

/**
 * Converts `FlowNetworkGraph` into a `MaxFlowGraph`.
 */
export function toMaxFlowGraph(graph: FlowNetworkGraph): MaxFlowGraph {
  return MaxFlowGraph.fromExampleGraph(graph);
}
