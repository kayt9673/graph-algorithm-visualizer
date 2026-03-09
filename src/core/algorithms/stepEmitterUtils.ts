import type { GraphEdge, GraphElement } from '../graph/types';

/**
 * Combines optional CSS class tokens into one class string.
 */
export function className(...names: Array<string | undefined>): string | undefined {
  const merged = names.filter(Boolean).join(' ').trim();
  return merged.length > 0 ? merged : undefined;
}

/**
 * Type guard for directed edge elements in `GraphElement` collections.
 */
export function isDirectedEdgeElement(element: GraphElement): element is GraphEdge {
  return 'source' in element.data && 'target' in element.data;
}

/**
 * Resolves a display label for a node id.
 */
export function labelOfNode(nodeId: string, nodeLabels?: Record<string, string>): string {
  return nodeLabels?.[nodeId] ?? nodeId;
}

/**
 * Wraps a node label in token form used by inspector text renderers.
 */
export function nodeLabelToken(label: string): string {
  return `[${label}]`;
}
