import type {
  BayesNetDataset,
  BayesNetDisplayNode,
  NodeStateProbability,
} from './types';

export interface BayesNetLayoutResult {
  nodes: BayesNetDisplayNode[];
  edges: Array<{ source: string; target: string; strength: number }>;
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
  });
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
    findingCount,
    diseaseStates: diagnosisCount,
  };
}

export function buildBayesNetLayout(dataset: BayesNetDataset): BayesNetLayoutResult {
  const diagnosisNodes: BayesNetDisplayNode[] = dataset.disease_node.states.map((diseaseState) => {
    const probabilities = buildDiagnosisProbabilities(dataset.disease_node.priors[diseaseState] ?? 0);
    return {
      id: `diagnosis:${diseaseState}`,
      name: toTitleCase(diseaseState),
      kind: 'diagnosis',
      parents: [],
      states: ['present', 'absent'],
      probabilities,
      maxProbability: Math.max(...probabilities.map((item) => item.probability), 0),
    };
  });

  const findingNodes: BayesNetDisplayNode[] = dataset.finding_nodes.map((finding) => {
    const probabilities = normalizeProbabilities(
      finding.states,
      Object.fromEntries(
        finding.states.map((state) => [
          state,
          dataset.disease_node.states.reduce((sum, diseaseState) => {
            const prior = dataset.disease_node.priors[diseaseState] ?? 0;
            const conditional = finding.cpt[diseaseState]?.[state] ?? 0;
            return sum + prior * conditional;
          }, 0),
        ]),
      ),
    );

    return {
      id: finding.name,
      name: toTitleCase(finding.name),
      kind: 'finding',
      parents: diagnosisNodes.map((node) => node.id),
      states: finding.states,
      probabilities,
      maxProbability: Math.max(...probabilities.map((item) => item.probability), 0),
      observationRate: finding.mean_observation_rate,
      discrimination: finding.discrimination,
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
