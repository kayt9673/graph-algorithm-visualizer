import type { ExampleGraph } from './types';

export function cloneGraph(graph: ExampleGraph): ExampleGraph {
  return JSON.parse(JSON.stringify(graph)) as ExampleGraph;
}
