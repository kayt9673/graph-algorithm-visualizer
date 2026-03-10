import type { ShortestPathGraph } from '../../graph/types';
import type { ShortestPathAlgorithmStep } from '../../steps/types';
import { runDijkstra } from './dijkstra';
import { labelOfNode, nodeLabelToken } from '../stepEmitterUtils';
import { buildNodeLabelMap, buildShortestPathElementsForStep } from './stepEmitterCommon';

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
 * Expands each Dijkstra snapshot into one UI step:
 * 1.) `Initial State` or `Iteration k`: Captures settled/frontier nodes and distance changes.
 * 2.) `Done`: Appends a final completed state.
 */
export function emitDijkstraSteps(graph: ShortestPathGraph, source: string): ShortestPathAlgorithmStep[] {
  const result = runDijkstra(graph, source);
  const steps: ShortestPathAlgorithmStep[] = [];
  const nodeLabels = buildNodeLabelMap(graph);

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
      shortestPathAlgorithm: 'dijkstra',
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
    currentStep.elements = buildShortestPathElementsForStep(graph, currentStep);
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
