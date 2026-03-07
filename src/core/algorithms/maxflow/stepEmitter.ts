import type { MaxFlowAlgorithmStep } from '../../steps/types';
import type { FlowNetworkGraph, GraphEdge, GraphElement } from '../../graph/types';
import type { MaxFlowGraph } from './MaxFlowGraph';
import { runFordFulkerson } from './fordFulkerson';

/**
 * Determines how edges are visualized in the graph.
 * `steady`: Normal display.
 * `path`: Highlights the augmenting path and dims all other edges.
 * `apply`: Highlights edges whose flow changed in the current step. 
 */
type FlowStepMode = 'steady' | 'path' | 'apply';
const FLOW_VISUAL_CLASSES = new Set(['augmenting', 'saturated', 'changed', 'dim']);

/**
 * Checks whether `element` is an edge.
 */
function isEdgeElement(element: GraphElement): element is GraphEdge {
  return 'source' in element.data && 'target' in element.data;
}

/**
 * Combines optional CSS class tokens into one string. 
 */
function className(...names: Array<string | undefined>): string | undefined {
  const merged = names.filter(Boolean).join(' ').trim();
  return merged.length > 0 ? merged : undefined;
}

/**
 * Removes step-specific visualization classes so each frame is derived from clean edge state.
 */
function stripFlowVisualClasses(classes?: string): string | undefined {
  if (!classes) return undefined;
  const cleaned = classes
    .split(/\s+/)
    .filter((token) => token.length > 0 && !FLOW_VISUAL_CLASSES.has(token))
    .join(' ');
  return cleaned.length > 0 ? cleaned : undefined;
}

/**
 * Returns a string version of the endpoints of `edge`, formatted as `u->v`.
 */
function edgePairId(edge: GraphEdge): string {
  return `${edge.data.source}->${edge.data.target}`;
}

/**
 * Builds a map (edgeID -> flowValue) of `elements`.
 */
function flowMapByEdgeId(elements: GraphElement[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const element of elements) {
    if (!isEdgeElement(element)) continue;
    map.set(element.data.id, element.data.flow ?? 0);
  }
  return map;
}

/**
 * Returns the edge IDs whose flow value changed between `previous` and `next`. 
 */
function computeChangedEdgeIds(previous: GraphElement[], next: GraphElement[]): Set<string> {
  const changed = new Set<string>();
  const previousMap = flowMapByEdgeId(previous);

  for (const element of next) {
    if (!isEdgeElement(element)) continue;
    const prev = previousMap.get(element.data.id) ?? 0;
    const cur = element.data.flow ?? 0;
    if (prev !== cur) changed.add(element.data.id);
  }

  return changed;
}

/**
 * Returns the elements of the residual graph from `elements`. 
 */
export function buildResidualElementsFromElements(elements: GraphElement[], path?: string[]): GraphElement[] {
  const nodes = elements.filter((element) => !isEdgeElement(element));
  const edges = elements.filter(isEdgeElement);
  const residualEdges: GraphEdge[] = [];
  const pathPairs = new Set<string>();

  if (path) {
    for (let i = 0; i < path.length - 1; i += 1) {
      pathPairs.add(`${path[i]}->${path[i + 1]}`);
    }
  }

  for (const edge of edges) {
    const capacity = edge.data.capacity ?? 0;
    const flow = edge.data.flow ?? 0;
    const forwardResidual = capacity - flow;
    const onPath = pathPairs.has(`${edge.data.source}->${edge.data.target}`);

    if (forwardResidual > 0) {
      residualEdges.push({
        data: {
          id: `${edge.data.id}:rf`,
          source: edge.data.source,
          target: edge.data.target,
          capacity: forwardResidual,
          flow: 0,
          label: `${forwardResidual}`,
        },
        classes: className(
          'residual',
          onPath ? 'residual-forward-focus' : undefined,
          pathPairs.size > 0 && !onPath ? 'residual-dim' : undefined,
        ),
      });
    }

    if (flow > 0) {
      residualEdges.push({
        data: {
          id: `${edge.data.id}:rb`,
          source: edge.data.target,
          target: edge.data.source,
          capacity: flow,
          flow: 0,
          label: `${flow}`,
        },
        classes: className(
          'residual',
          onPath ? 'residual-backward-focus' : undefined,
          pathPairs.size > 0 && !onPath ? 'residual-dim' : undefined,
        ),
      });
    }
  }

  return [...nodes, ...residualEdges];
}

/**
 * Adds visualization classes to `elements` for the current step.
 * `augmenting`: The edge is on the current augmenting path.
 * `saturated`: The edge's flow value is equal to its capacity.
 * `changed`: The edge's flow value changed from the previous step.
 * `dim`: The edge is not on the current augmenting path. 
 */
function annotateFlowElements(
  elements: GraphElement[],
  path?: string[],
  changedEdgeIds: Set<string> = new Set<string>(),
  mode: FlowStepMode = 'steady',
): GraphElement[] {
  const pathEdges = new Set<string>();
  if (path) {
    for (let i = 0; i < path.length - 1; i += 1) {
      pathEdges.add(`${path[i]}->${path[i + 1]}`);
    }
  }

  const nodes = elements.filter((element) => !isEdgeElement(element));
  const edges = elements.filter(isEdgeElement).map((edge) => {
    const inPath = pathEdges.has(edgePairId(edge));
    const saturated = (edge.data.flow ?? 0) >= (edge.data.capacity ?? 0);
    const dim = mode === 'path' && pathEdges.size > 0 && !inPath;

    return {
      ...edge,
      classes: className(
        stripFlowVisualClasses(edge.classes),
        inPath ? 'augmenting' : undefined,
        saturated ? 'saturated' : undefined,
        changedEdgeIds.has(edge.data.id) ? 'changed' : undefined,
        dim ? 'dim' : undefined,
      ),
    };
  });

  return nodes.concat(edges);
}

/**
 * Converts `flowGraph` to a `GraphElement[]` with corresponding visualizations.
 */
function toFlowElements(
  flowGraph: MaxFlowGraph,
  path?: string[],
  changedEdgeIds: Set<string> = new Set<string>(),
  mode: FlowStepMode = 'steady',
): GraphElement[] {
  const graph = flowGraph.toExampleGraph();
  return annotateFlowElements(graph.nodes.concat(graph.edges), path, changedEdgeIds, mode);
}

/**
 * Expands each `graph` snapshot into two UI steps:
 * 1.) `Found Path`: Highlights the current augmenting path.
 * 2.) `Apply Flow`: Identifies the bottleneck edge, then marks the edges that changed flow value, and 
 * updates the residual graph. 
 */
export function emitFordFulkersonSteps(graph: FlowNetworkGraph): MaxFlowAlgorithmStep[] {
  const result = runFordFulkerson(graph);
  const initialElements = graph.nodes.concat(graph.edges);
  const steps: MaxFlowAlgorithmStep[] = [
    {
      id: 0,
      title: 'Initial State',
      description: `Starting Ford-Fulkerson from ${graph.source.toUpperCase()} to ${graph.sink.toUpperCase()}.`,
      currentFlow: 0,
      totalMaxFlow: 0,
      elements: annotateFlowElements(initialElements, undefined, new Set<string>(), 'steady'),
      residualElements: buildResidualElementsFromElements(initialElements),
    },
  ];

  let previousFlowElements = initialElements;
  let previousTotalFlow = 0;

  for (const snapshot of result.snapshots) {
    const pathText = snapshot.path?.join(' -> ') ?? 'unknown';
    const nextFlowElements = toFlowElements(snapshot.flowGraph);
    const changedEdgeIds = computeChangedEdgeIds(previousFlowElements, nextFlowElements);

    steps.push({
      id: steps.length,
      title: `Iteration ${snapshot.iteration}: Found Path`,
      description: `Found augmenting path ${pathText}. Bottleneck is ${snapshot.bottleneck ?? 0}.`,
      currentFlow: previousTotalFlow,
      bottleneck: snapshot.bottleneck,
      path: snapshot.path,
      totalMaxFlow: previousTotalFlow,
      elements: annotateFlowElements(previousFlowElements, snapshot.path, new Set<string>(), 'path'),
      residualElements: buildResidualElementsFromElements(previousFlowElements, snapshot.path),
    });

    steps.push({
      id: steps.length,
      title: `Iteration ${snapshot.iteration}: Apply Flow`,
      description: `Applied +${snapshot.bottleneck ?? 0} flow on ${pathText}.`,
      currentFlow: snapshot.totalFlow,
      flowDelta: snapshot.totalFlow - previousTotalFlow,
      bottleneck: snapshot.bottleneck,
      path: snapshot.path,
      totalMaxFlow: snapshot.totalFlow,
      elements: annotateFlowElements(nextFlowElements, snapshot.path, changedEdgeIds, 'apply'),
      residualElements: buildResidualElementsFromElements(nextFlowElements, snapshot.path),
    });

    previousFlowElements = nextFlowElements;
    previousTotalFlow = snapshot.totalFlow;
  }

  const finalElements = annotateFlowElements(previousFlowElements);
  const finalResidual = buildResidualElementsFromElements(finalElements);

  steps.push({
    id: steps.length,
    title: 'Maximum Flow Achieved',
    description: `No augmenting path remains. Maximum flow is ${result.maxFlow}.`,
    currentFlow: result.maxFlow,
    totalMaxFlow: result.maxFlow,
    elements: finalElements,
    residualElements: finalResidual,
  });

  return steps;
}
