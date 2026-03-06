import type { AlgorithmStep } from '../../../core/steps/types';
import type { GraphEdge, GraphElement } from '../../../core/graph/types';
import { exampleGraphs } from '../../../data/examples/exampleGraphs';

function isEdgeElement(element: GraphElement): element is GraphEdge {
  return 'source' in element.data && 'target' in element.data;
}

function buildResidualElements(elements: GraphElement[]): GraphElement[] {
  const nodes = elements.filter((element) => !isEdgeElement(element));
  const edges = elements.filter(isEdgeElement);
  const residualEdges: GraphEdge[] = [];

  for (const edge of edges) {
    const capacity = edge.data.capacity ?? 0;
    const flow = edge.data.flow ?? 0;
    const forwardResidual = capacity - flow;

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
        classes: 'residual',
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
        classes: 'residual',
      });
    }
  }

  return [...nodes, ...residualEdges];
}

const steps: AlgorithmStep[] = [
  {
    id: 0,
    title: 'Initial State',
    description:
      'Starting Ford-Fulkerson algorithm. All edges have zero flow. We will find augmenting paths from source S to sink T.',
    currentFlow: 0,
    totalMaxFlow: 0,
    elements: exampleGraphs.simple.nodes.concat(exampleGraphs.simple.edges),
  },
  {
    id: 1,
    title: 'Found Augmenting Path',
    description:
      'Found path S -> A -> T with bottleneck capacity 10. This is the minimum capacity along the path.',
    currentFlow: 0,
    bottleneck: 10,
    path: ['s', 'a', 't'],
    totalMaxFlow: 0,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 0, label: '0/10' }, classes: 'augmenting' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 0, label: '0/10' }, classes: 'augmenting' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ],
  },
  {
    id: 2,
    title: 'Augment Flow',
    description: 'Increased flow by 10 units along path S -> A -> T. Edges are now saturated.',
    currentFlow: 10,
    path: ['s', 'a', 't'],
    totalMaxFlow: 10,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ],
  },
  {
    id: 3,
    title: 'Found Another Path',
    description: 'Found path S -> B -> T with bottleneck capacity 5.',
    currentFlow: 10,
    bottleneck: 5,
    path: ['s', 'b', 't'],
    totalMaxFlow: 10,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' }, classes: 'augmenting' },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' }, classes: 'augmenting' },
    ],
  },
  {
    id: 4,
    title: 'Maximum Flow Achieved',
    description: 'No more augmenting paths exist. The maximum flow from S to T is 15 units.',
    currentFlow: 15,
    totalMaxFlow: 15,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 5, label: '5/5' }, classes: 'saturated' },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 5, label: '5/5' }, classes: 'saturated' },
    ],
  },
];

export const mockAlgorithmSteps: AlgorithmStep[] = steps.map((step) => ({
  ...step,
  residualElements: buildResidualElements(step.elements),
}));
