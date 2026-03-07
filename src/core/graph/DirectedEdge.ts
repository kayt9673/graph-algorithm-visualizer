import type { GraphEdge } from './types';

export interface DirectedEdgeInit {
  id: string;
  source: string;
  target: string;
  label?: string;
  classes?: string;
}

/**
 * A directed edge. 
 */
export class DirectedEdge {
  /** The ID of the edge. */
  public readonly id: string;
  /** The source node of the edge. */
  public readonly source: string;
  /** The target node of the edge. */
  public readonly target: string;
  /** Optional display label of the edge. */
  public label?: string;
  /** Optional class string for visualization styling. */
  public classes?: string;

  constructor(init: DirectedEdgeInit) {
    this.id = init.id;
    this.source = init.source;
    this.target = init.target;
    this.label = init.label;
    this.classes = init.classes;
  }

  /**
   * Converts this edge to UI-friendly `GraphEdge`.
   */
  toGraphEdge(): GraphEdge {
    return {
      data: {
        id: this.id,
        source: this.source,
        target: this.target,
        label: this.label,
      },
      classes: this.classes,
    };
  }

  /**
   * Returns a copy of this edge.
   */
  clone(): DirectedEdge {
    return new DirectedEdge({
      id: this.id,
      source: this.source,
      target: this.target,
      label: this.label,
      classes: this.classes,
    });
  }
}
