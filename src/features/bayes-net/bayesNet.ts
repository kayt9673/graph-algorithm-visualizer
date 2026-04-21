import type {
  BayesNetDataset,
  BayesNetDisplayNode,
  NodeStateProbability,
} from './types';

export type BayesNetEvidence = Record<string, string | undefined>;

export interface BayesNetLayoutResult {
  nodes: BayesNetDisplayNode[];
  edges: Array<{ source: string; target: string }>;
  width: number;
  height: number;
}

function toTitleCase(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeProbabilities(
  states: string[],
  values: Record<string, number> | undefined,
): NodeStateProbability[] {
  const probabilities = states.map((state) => ({
    state,
    probability: values?.[state] ?? 0,
  }));
  const total = probabilities.reduce((sum, item) => sum + item.probability, 0);

  if (total <= 0) {
    const uniform = states.length > 0 ? 1 / states.length : 0;
    return states.map((state) => ({ state, probability: uniform }));
  }

  return probabilities.map((item) => ({
    ...item,
    probability: item.probability / total,
  }));
}

function buildDiagnosisProbabilities(prior: number): NodeStateProbability[] {
  return normalizeProbabilities(['present', 'absent'], {
    present: prior,
    absent: Math.max(0, 1 - prior),
  });
}

function computeDiagnosisPosterior(
  dataset: BayesNetDataset,
  evidence: BayesNetEvidence,
): Record<string, number> {
  const unnormalized = Object.fromEntries(
    dataset.disease_node.states.map((diseaseState) => {
      let probability = dataset.disease_node.priors[diseaseState] ?? 0;

      for (const finding of dataset.finding_nodes) {
        const observedState = evidence[finding.name];
        if (!observedState) continue;
        probability *= finding.cpt[diseaseState]?.[observedState] ?? 0;
      }

      return [diseaseState, probability];
    }),
  );

  const total = Object.values(unnormalized).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return Object.fromEntries(
      dataset.disease_node.states.map((diseaseState) => [
        diseaseState,
        dataset.disease_node.priors[diseaseState] ?? 0,
      ]),
    );
  }

  return Object.fromEntries(
    Object.entries(unnormalized).map(([diseaseState, probability]) => [
      diseaseState,
      probability / total,
    ]),
  );
}

function buildObservedProbabilities(states: string[], observedState: string): NodeStateProbability[] {
  return states.map((state) => ({
    state,
    probability: state === observedState ? 1 : 0,
  }));
}

function computeFindingPosteriorProbabilities(
  dataset: BayesNetDataset,
  findingName: string,
  diagnosisPosterior: Record<string, number>,
  evidence: BayesNetEvidence,
): NodeStateProbability[] {
  const finding = dataset.finding_nodes.find((node) => node.name === findingName);
  if (!finding) return [];

  const observedState = evidence[finding.name];
  if (observedState) {
    return buildObservedProbabilities(finding.states, observedState);
  }

  return normalizeProbabilities(
    finding.states,
    Object.fromEntries(
      finding.states.map((state) => [
        state,
        dataset.disease_node.states.reduce((sum, diseaseState) => {
          const posterior = diagnosisPosterior[diseaseState] ?? 0;
          const conditional = finding.cpt[diseaseState]?.[state] ?? 0;
          return sum + posterior * conditional;
        }, 0),
      ]),
    ),
  );
}

function computeAverageFindingDistribution(dataset: BayesNetDataset, findingName: string): Record<string, number> {
  const finding = dataset.finding_nodes.find((node) => node.name === findingName);
  if (!finding) return {};

  return Object.fromEntries(
    finding.states.map((state) => [
      state,
      dataset.disease_node.states.reduce((sum, diseaseState) => {
        const prior = dataset.disease_node.priors[diseaseState] ?? 0;
        const conditional = finding.cpt[diseaseState]?.[state] ?? 0;
        return sum + prior * conditional;
      }, 0),
    ]),
  );
}

function scoreDiagnosisFindingLink(
  dataset: BayesNetDataset,
  findingName: string,
  diseaseState: string,
): number {
  const finding = dataset.finding_nodes.find((node) => node.name === findingName);
  if (!finding) return 0;

  const average = computeAverageFindingDistribution(dataset, findingName);
  const conditional = finding.cpt[diseaseState] ?? {};
  const distance = finding.states.reduce((sum, state) => {
    return sum + Math.abs((conditional[state] ?? 0) - (average[state] ?? 0));
  }, 0);

  return distance * (finding.discrimination ?? 1);
}

function buildVisibleEdges(
  dataset: BayesNetDataset,
  diagnosisNodes: BayesNetDisplayNode[],
  findingNodes: BayesNetDisplayNode[],
) {
  return findingNodes.flatMap((findingNode) => {
    const ranked = diagnosisNodes
      .map((diagnosisNode) => {
        const diseaseState = diagnosisNode.id.replace('diagnosis:', '');
        const strength = scoreDiagnosisFindingLink(dataset, findingNode.id, diseaseState);
        return {
          source: diagnosisNode.id,
          target: findingNode.id,
          strength,
        };
      })
      .sort((a, b) => b.strength - a.strength);

    return ranked.slice(0, 2);
  }).map(({ source, target }) => ({ source, target }));
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

export function summarizeNetwork(dataset: BayesNetDataset) {
  const diagnosisCount = dataset.disease_node.states.length;
  const findingCount = dataset.finding_nodes.length;
  const edgeCount = findingCount * Math.min(2, diagnosisCount);
  return {
    nodeCount: diagnosisCount + findingCount,
    edgeCount,
    diseaseStates: diagnosisCount,
  };
}

export function buildBayesNetLayout(
  dataset: BayesNetDataset,
  evidence: BayesNetEvidence = {},
): BayesNetLayoutResult {
  const diagnosisPosterior = computeDiagnosisPosterior(dataset, evidence);

  const diagnosisNodes: BayesNetDisplayNode[] = dataset.disease_node.states.map((diseaseState) => {
    const probabilities = buildDiagnosisProbabilities(diagnosisPosterior[diseaseState] ?? 0);
    return {
      id: `diagnosis:${diseaseState}`,
      name: toTitleCase(diseaseState),
      kind: 'diagnosis',
      parents: [],
      states: ['present', 'absent'],
      probabilities,
    };
  });

  const findingNodes: BayesNetDisplayNode[] = dataset.finding_nodes.map((finding) => {
    const probabilities = computeFindingPosteriorProbabilities(
      dataset,
      finding.name,
      diagnosisPosterior,
      evidence,
    );

    return {
      id: finding.name,
      name: toTitleCase(finding.name),
      kind: 'finding',
      parents: diagnosisNodes.map((node) => node.id),
      states: finding.states,
      probabilities,
    };
  });

  const displayNodes: BayesNetDisplayNode[] = [
    ...diagnosisNodes,
    ...findingNodes,
  ];
  const edges = buildVisibleEdges(dataset, diagnosisNodes, findingNodes);

  return {
    nodes: displayNodes,
    edges,
    width: 1600,
    height: 1200,
  };
}
