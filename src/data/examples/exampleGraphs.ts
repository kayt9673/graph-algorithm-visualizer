import type { ExampleGraph } from '../../core/graph/types';

export const exampleGraphs: Record<string, ExampleGraph> = {
  simple: {
    name: 'Simple Flow Network',
    nodes: [
      { data: { id: 's', label: 'S' }, classes: 'source' },
      { data: { id: 'a', label: 'A' } },
      { data: { id: 'b', label: 'B' } },
      { data: { id: 't', label: 'T' }, classes: 'sink' },
    ],
    edges: [
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 0, label: '0/10' } },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 0, label: '0/10' } },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ],
    source: 's',
    sink: 't',
  },
  complex: {
    name: 'Complex Flow Network',
    nodes: [
      { data: { id: 's', label: 'S' }, classes: 'source' },
      { data: { id: 'a', label: 'A' } },
      { data: { id: 'b', label: 'B' } },
      { data: { id: 'c', label: 'C' } },
      { data: { id: 'd', label: 'D' } },
      { data: { id: 't', label: 'T' }, classes: 'sink' },
    ],
    edges: [
      { data: { id: 'e1', source: 's', target: 'a', capacity: 16, flow: 0, label: '0/16' } },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 13, flow: 0, label: '0/13' } },
      { data: { id: 'e3', source: 'a', target: 'c', capacity: 12, flow: 0, label: '0/12' } },
      { data: { id: 'e4', source: 'b', target: 'a', capacity: 4, flow: 0, label: '0/4' } },
      { data: { id: 'e5', source: 'b', target: 'd', capacity: 14, flow: 0, label: '0/14' } },
      { data: { id: 'e6', source: 'c', target: 'b', capacity: 9, flow: 0, label: '0/9' } },
      { data: { id: 'e7', source: 'c', target: 't', capacity: 20, flow: 0, label: '0/20' } },
      { data: { id: 'e8', source: 'd', target: 'c', capacity: 7, flow: 0, label: '0/7' } },
      { data: { id: 'e9', source: 'd', target: 't', capacity: 4, flow: 0, label: '0/4' } },
    ],
    source: 's',
    sink: 't',
  },
};
