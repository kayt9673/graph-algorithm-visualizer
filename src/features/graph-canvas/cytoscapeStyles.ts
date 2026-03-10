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
    selector: 'node.sp-node',
    style: {
      'background-color': '#64748b',
      'border-width': 2,
      'border-color': '#475569',
    },
  },
  {
    selector: 'node.sp-frontier',
    style: {
      'background-color': '#f59e0b',
      'border-width': 3,
      'border-color': '#d97706',
    },
  },
  {
    selector: 'node.sp-discovered',
    style: {
      'background-color': '#ef4444',
      'border-width': 3,
      'border-color': '#b91c1c',
    },
  },
  {
    selector: 'node.sp-current',
    style: {
      'background-color': '#22c55e',
      'border-width': 4,
      'border-color': '#15803d',
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
      'line-color': '#64748b',
      'target-arrow-color': '#64748b',
      'line-style': 'dashed',
      width: 3,
    },
  },
  {
    selector: 'edge.residual.residual-forward-focus',
    style: {
      'line-color': '#22c55e',
      'target-arrow-color': '#22c55e',
      'line-style': 'dashed',
      width: 5,
      opacity: 1,
      'z-index': 999,
    },
  },
  {
    selector: 'edge.residual.residual-backward-focus',
    style: {
      'line-color': '#f97316',
      'target-arrow-color': '#f97316',
      'line-style': 'dashed',
      width: 5,
      opacity: 1,
      'z-index': 999,
    },
  },
  {
    selector: 'edge.residual-dim',
    style: {
      opacity: 0.35,
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
  {
    selector: 'edge.sp-tree',
    style: {
      'line-color': '#16a34a',
      'target-arrow-color': '#16a34a',
      width: 4,
    },
  },
  {
    selector: 'edge.sp-inspecting',
    style: {
      'line-color': '#22c55e',
      'target-arrow-color': '#22c55e',
      width: 5,
      opacity: 1,
      'line-opacity': 1,
      'target-arrow-opacity': 1,
      'text-opacity': 1,
    },
  },
  {
    selector: 'edge.sp-bf',
    style: {
      opacity: 0.7,
      'line-opacity': 0.7,
      'target-arrow-opacity': 0.7,
      'text-opacity': 0.8,
    },
  },
  {
    selector: 'edge.sp-dim',
    style: {
      opacity: 0.55,
      'line-opacity': 0.55,
      'target-arrow-opacity': 0.55,
      'text-opacity': 0.75,
    },
  },
  {
    selector: 'edge.sp-bf.sp-inspecting',
    style: {
      opacity: 1,
      'line-opacity': 1,
      'target-arrow-opacity': 1,
      'text-opacity': 1,
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
