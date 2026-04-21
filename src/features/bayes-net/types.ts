export interface BayesNetRootNode {
  name: string;
  states: string[];
  priors: Record<string, number>;
}

export interface BayesNetFindingNode {
  name: string;
  parents: string[];
  states: string[];
  mean_observation_rate?: number;
  discrimination?: number;
  cpt: Record<string, Record<string, number>>;
}

export interface BayesNetDataset {
  network_type: string;
  export_scope?: string;
  priors_are_conditional_on_modeled_diseases?: boolean;
  excluded_diseases?: string[];
  excluded_findings?: string[];
  minimum_finding_discrimination?: number;
  edges: Array<[string, string]>;
  disease_node: BayesNetRootNode;
  finding_nodes: BayesNetFindingNode[];
}

export interface NodeStateProbability {
  state: string;
  probability: number;
}

export interface BayesNetDisplayNode {
  id: string;
  name: string;
  kind: 'diagnosis' | 'finding';
  parents: string[];
  states: string[];
  probabilities: NodeStateProbability[];
  maxProbability: number;
  observationRate?: number;
  discrimination?: number;
}
