import type { GraphElement, ShortestPathGraph } from '../../graph/types';
import type { ShortestPathAlgorithmStep } from '../../steps/types';
import { runDijkstra } from './dijkstra';
import { className, labelOfNode, nodeLabelToken } from '../stepEmitterUtils';

/**
 * Returns the high-level step description for `snapshot`.
 */
function buildIterationDescription(
  source: string,
  snapshot: ShortestPathAlgorithmStep,
  previousSnapshot?: ShortestPathAlgorithmStep,
): string {
  const sourceLabel = labelOfNode(source, snapshot.nodeLabels);

  if (snapshot.id === 0) {
    return `Starting Dijkstra from ${nodeLabelToken(sourceLabel)}. Initialized d(${nodeLabelToken(sourceLabel)}) = 0 and all other distances to INF.`;
  }

  const u = snapshot.current;
  if (!u) {
    return 'No current node in this step.';
  }

  const uLabel = labelOfNode(u, snapshot.nodeLabels);
  const previousFrontier = new Set(previousSnapshot?.frontier ?? []);
  const addedToFrontier = snapshot.frontier.filter((nodeId) => !previousFrontier.has(nodeId));
  const frontierText = addedToFrontier.length > 0
    ? ` Added to frontier: ${addedToFrontier.map((nodeId) => nodeLabelToken(labelOfNode(nodeId, snapshot.nodeLabels))).join(', ')}.`
    : ' Added to frontier: None.';

  return `Settled ${nodeLabelToken(uLabel)}.${frontierText}`;
}

/**
 * Returns distance changes for each edge in `graph` during this iteration.
 */
function buildDistanceChanges(
  graph: ShortestPathGraph,
  snapshot: ShortestPathAlgorithmStep,
  previousSnapshot?: ShortestPathAlgorithmStep,
): ShortestPathAlgorithmStep['distanceChanges'] {
  const u = snapshot.current;
  if (!u || !previousSnapshot) return [];

  const outgoing = graph.edges.filter((edge) => edge.data.source === u);
  const baseDist = previousSnapshot.distances[u];

  return outgoing.map((edge) => {
    const v = edge.data.target;
    const weight = edge.data.weight;
    const previousDistance = previousSnapshot.distances[v];
    const candidate = baseDist + weight;
    const nextDistance = snapshot.distances[v];
    const updated = Number.isFinite(candidate) && candidate < previousDistance && nextDistance === candidate;

    return {
      from: u,
      to: v,
      baseDistance: baseDist,
      weight,
      candidate,
      previousDistance,
      nextDistance,
      updated,
    };
  });
}

/**
 * Adds shortest-path visualization classes to `graph` for one `step`.
 */
function buildElementsForSnapshot(graph: ShortestPathGraph, step: ShortestPathAlgorithmStep): GraphElement[] {
  const frontierSet = new Set(step.frontier);
  const discoveredSet = new Set(step.discovered);
  const current = step.current;

  const nodes = graph.nodes.map((node) => {
    const nodeId = node.data.id;
    const isCurrent = current === nodeId;
    const inDiscovered = discoveredSet.has(nodeId);
    const inFrontier = frontierSet.has(nodeId);

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
    return {
      ...edge,
      data: {
        ...edge.data,
        label: `${edge.data.weight}`,
      },
      classes: className(
        edge.classes,
        treePairs.has(pair) ? 'sp-tree' : undefined,
      ),
    };
  });

  return [...nodes, ...edges];
}

/**
 * Expands each Dijkstra snapshot into one UI step:
 * 1.) `Initial State` or `Iteration k`: Captures settled/frontier nodes and distance changes.
 * 2.) `Done`: Appends a final completed state.
 */
export function emitDijkstraSteps(graph: ShortestPathGraph, source: string): ShortestPathAlgorithmStep[] {
  const result = runDijkstra(graph, source);
  const steps: ShortestPathAlgorithmStep[] = [];
  const nodeLabels = Object.fromEntries(graph.nodes.map((node) => [node.data.id, node.data.label]));

  for (let i = 0; i < result.snapshots.length; i += 1) {
    const snapshot = result.snapshots[i];
    const prev = steps[steps.length - 1];
    const title = snapshot.iteration === 0
      ? 'Initial State'
      : `Iteration ${snapshot.iteration}`;

    const currentStep: ShortestPathAlgorithmStep = {
      id: i,
      title,
      description: '',
      source: snapshot.source,
      nodeLabels,
      current: snapshot.current,
      frontier: snapshot.frontier,
      discovered: snapshot.discovered,
      distances: snapshot.distances,
      previous: snapshot.previous,
      distanceChanges: [],
      elements: [],
    };

    currentStep.description = buildIterationDescription(source, currentStep, prev);
    currentStep.distanceChanges = buildDistanceChanges(graph, currentStep, prev);
    currentStep.id = steps.length;
    currentStep.elements = buildElementsForSnapshot(graph, currentStep);
    steps.push(currentStep);
  }

  const finalStep = steps[steps.length - 1];
  if (finalStep) {
    steps.push({
      ...finalStep,
      id: steps.length,
      title: 'Done',
      description: `Finished Dijkstra from ${nodeLabelToken(labelOfNode(source, nodeLabels))}.`,
    });
  }

  return steps;
}
