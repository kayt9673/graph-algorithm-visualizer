import type { ShortestPathGraph } from '../../graph/types';
import type { ShortestPathAlgorithmStep } from '../../steps/types';
import type { BellmanFordSnapshot } from './bellmanFord';
import { runBellmanFord } from './bellmanFord';
import { labelOfNode, nodeLabelToken } from '../stepEmitterUtils';
import { buildNodeLabelMap, buildShortestPathElementsForStep } from './stepEmitterCommon';

/**
 * Returns distance changes for the inspected edge in this iteration.
 */
function buildBellmanFordDistanceChanges(
  snapshot: BellmanFordSnapshot,
  currentStep: ShortestPathAlgorithmStep,
  previousSnapshot?: ShortestPathAlgorithmStep,
): ShortestPathAlgorithmStep['distanceChanges'] {
  if (!previousSnapshot || !snapshot.inspectedEdge) return [];

  const { from, to, weight } = snapshot.inspectedEdge;
  const baseDistance = previousSnapshot.distances[from];
  const previousDistance = previousSnapshot.distances[to];
  const candidate = baseDistance + weight;
  const nextDistance = currentStep.distances[to];
  const updated = Number.isFinite(candidate) && candidate < previousDistance && nextDistance === candidate;

  return [{
    from,
    to,
    baseDistance,
    weight,
    candidate,
    previousDistance,
    nextDistance,
    updated,
  }];
}

/**
 * Expands each Bellman-Ford snapshot into one UI step:
 * 1.) `Initial State` or `Edge Check k`: Captures the inspected edge and distance change.
 * 2.) `Done`: Appends a final completed state.
 */
export function emitBellmanFordSteps(graph: ShortestPathGraph, source: string): ShortestPathAlgorithmStep[] {
  const result = runBellmanFord(graph, source);
  const steps: ShortestPathAlgorithmStep[] = [];
  const nodeLabels = buildNodeLabelMap(graph);

  for (let i = 0; i < result.snapshots.length; i += 1) {
    const snapshot = result.snapshots[i];
    const prev = steps[steps.length - 1];
    const title = i === 0
      ? 'Initial State'
      : `Edge Check ${snapshot.iteration}`;

    const currentStep: ShortestPathAlgorithmStep = {
      id: i,
      title,
      description: '',
      shortestPathAlgorithm: 'bellman-ford',
      hasNegativeCycle: result.hasNegativeCycle,
      negativeCycleNodes: result.negativeCycleNodes,
      source: snapshot.source,
      nodeLabels,
      current: snapshot.inspectedEdge?.from ?? null,
      frontier: [],
      discovered: [],
      distances: snapshot.distances,
      previous: snapshot.previous,
      distanceChanges: [],
      elements: [],
    };

    currentStep.description = snapshot.iteration === 0
      ? `Starting Bellman-Ford from ${nodeLabelToken(labelOfNode(source, nodeLabels))}. Initialized dist(${nodeLabelToken(labelOfNode(source, nodeLabels))}) = 0 and all other distances to INF.`
      : snapshot.inspectedEdge
        ? `Checked edge ${nodeLabelToken(labelOfNode(snapshot.inspectedEdge.from, nodeLabels))} -> ${nodeLabelToken(labelOfNode(snapshot.inspectedEdge.to, nodeLabels))}.`
        : `Completed Bellman-Ford edge check ${snapshot.iteration}.`;
    currentStep.distanceChanges = buildBellmanFordDistanceChanges(snapshot, currentStep, prev);
    currentStep.id = steps.length;
    currentStep.elements = buildShortestPathElementsForStep(graph, currentStep);
    steps.push(currentStep);
  }

  const finalStep = steps[steps.length - 1];
  if (finalStep) {
    const summary = result.hasNegativeCycle
      ? 'Detected a negative cycle reachable from the source.'
      : 'No negative cycle detected.';

    steps.push({
      ...finalStep,
      id: steps.length,
      title: 'Done',
      description: `Finished Bellman-Ford from ${nodeLabelToken(labelOfNode(source, nodeLabels))}. ${summary}`,
    });
  }

  return steps;
}
