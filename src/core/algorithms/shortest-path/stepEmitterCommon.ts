import type { GraphElement, ShortestPathGraph } from '../../graph/types';
import type { ShortestPathAlgorithmStep } from '../../steps/types';
import { className } from '../stepEmitterUtils';

/**
 * Builds a stable map of internal node ids to display labels.
 */
export function buildNodeLabelMap(graph: ShortestPathGraph): Record<string, string> {
  return Object.fromEntries(graph.nodes.map((node) => [node.data.id, node.data.label]));
}

/**
 * Adds shortest-path visualization classes to `graph` for one `step`.
 */
export function buildShortestPathElementsForStep(
  graph: ShortestPathGraph,
  step: ShortestPathAlgorithmStep,
): GraphElement[] {
  const isBellmanFord = step.shortestPathAlgorithm === 'bellman-ford';
  const frontierSet = new Set(step.frontier);
  const discoveredSet = new Set(step.discovered);
  const current = step.current;
  const activeDistanceChange = step.distanceChanges?.[0];
  const activeFrom = activeDistanceChange?.from;
  const activeTo = activeDistanceChange?.to;

  const nodes = graph.nodes.map((node) => {
    const nodeId = node.data.id;
    const isCurrent = isBellmanFord ? false : current === nodeId;
    const inDiscovered = isBellmanFord ? false : discoveredSet.has(nodeId);
    const inFrontier = isBellmanFord ? false : frontierSet.has(nodeId);

    return {
      ...node,
      classes: className(
        'sp-node',
        inFrontier ? 'sp-frontier' : undefined,
        inDiscovered ? 'sp-discovered' : undefined,
        isCurrent ? 'sp-current' : undefined,
      ),
    };
  });

  const treePairs = new Set<string>();
  for (const [nodeId, prev] of Object.entries(step.previous)) {
    if (!prev) continue;
    treePairs.add(`${prev}->${nodeId}`);
  }

  const edges = graph.edges.map((edge) => {
    const pair = `${edge.data.source}->${edge.data.target}`;
    const isInspectingEdge = isBellmanFord
      && activeFrom === edge.data.source
      && activeTo === edge.data.target;
    const hasActiveInspection = isBellmanFord && Boolean(activeDistanceChange);
    const shouldDim = hasActiveInspection && !isInspectingEdge;

    return {
      ...edge,
      data: {
        ...edge.data,
        label: `${edge.data.weight}`,
      },
      classes: className(
        edge.classes,
        hasActiveInspection ? 'sp-bf' : undefined,
        isInspectingEdge ? 'sp-inspecting' : undefined,
        shouldDim ? 'sp-dim' : undefined,
        treePairs.has(pair) ? 'sp-tree' : undefined,
      ),
    };
  });

  return [...nodes, ...edges];
}
