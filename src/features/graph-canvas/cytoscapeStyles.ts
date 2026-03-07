export const CYTOSCAPE_STYLE = [
  {
    selector: 'node',
    style: {
      'background-color': '#2563eb',
      label: 'data(label)',
      color: '#030213',
      'text-valign': 'center',
      'text-halign': 'center',
      width: 40,
      height: 40,
      'font-size': '14px',
      'font-weight': '500',
      'transition-property': 'background-color, border-color, border-width',
      'transition-duration': '220ms',
      'transition-timing-function': 'ease-in-out',
    },
  },
  {
    selector: 'node.source',
    style: {
      'background-color': '#16a34a',
      'border-width': 3,
      'border-color': '#15803d',
    },
  },
  {
    selector: 'node.sink',
    style: {
      'background-color': '#dc2626',
      'border-width': 3,
      'border-color': '#b91c1c',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 3,
      'line-color': '#2563eb',
      'target-arrow-color': '#2563eb',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      label: 'data(label)',
      'text-rotation': 'autorotate',
      'font-size': '12px',
      'text-outline-color': '#ffffff',
      'text-outline-width': 2,
      'transition-property': 'line-color, target-arrow-color, width, opacity',
      'transition-duration': '260ms',
      'transition-timing-function': 'ease-in-out',
    },
  },
  {
    selector: 'edge.augmenting',
    style: {
      'line-color': '#16a34a',
      'target-arrow-color': '#16a34a',
      width: 4,
    },
  },
  {
    selector: 'edge.saturated',
    style: {
      'line-color': '#dc2626',
      'target-arrow-color': '#dc2626',
      width: 4,
    },
  },
  {
    selector: 'edge.residual',
    style: {
      'line-color': '#9ca3af',
      'target-arrow-color': '#9ca3af',
      'line-style': 'dashed',
      width: 2,
    },
  },
  {
    selector: 'edge.changed',
    style: {
      'line-color': '#f59e0b',
      'target-arrow-color': '#f59e0b',
      width: 5,
    },
  },
  {
    selector: 'edge.dim',
    style: {
      opacity: 0.2,
    },
  },
] as const;

export const CYTOSCAPE_LAYOUT = {
  name: 'cose',
  idealEdgeLength: 100,
  nodeOverlap: 20,
  refresh: 20,
  fit: true,
  padding: 30,
  randomize: false,
  componentSpacing: 100,
  nodeRepulsion: 400000,
  edgeElasticity: 100,
  nestingFactor: 5,
  gravity: 80,
  numIter: 1000,
  initialTemp: 200,
  coolingFactor: 0.95,
  minTemp: 1.0,
} as const;
