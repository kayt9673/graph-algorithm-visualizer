import { DirectedEdge, type DirectedEdgeInit } from '../../graph/DirectedEdge';
import type { GraphEdge } from '../../graph/types';

export interface MaxFlowEdgeInit extends DirectedEdgeInit {
  capacity: number;
  flow?: number;
}

/**
 * A directed edge with an edge capacity and current flow value. 
 */
export class MaxFlowEdge extends DirectedEdge {
  
  /** A positive edge capacity. (Default is 1). */
  public capacity: number;
  /** The current flow value of the edge. (Default is 0). */
  public flow: number;

  constructor(init: MaxFlowEdgeInit) {
    super(init);
    this.capacity = init.capacity ?? 1;
    this.flow = init.flow ?? 0;
    this.label = this.formatLabel();
  }

  /**
   * Returns the forward residual capacity available on this edge.
   */
  get residualForward(): number {
    return this.capacity - this.flow;
  }

  /**
   * Returns the backward residual capacity available on this edge.
   */
  get residualBackward(): number {
    return this.flow;
  }

  /**
   * Applies a flow delta and refreshes the edge label.
   */
  addFlow(delta: number): void {
    this.flow += delta;
    this.label = this.formatLabel();
  }

  /**
   * Returns the edge label `flow/capacity`.
   */
  formatLabel(): string {
    return `${this.flow}/${this.capacity}`;
  }

  /**
   * Converts this class instance to app `GraphEdge` shape.
   */
  override toGraphEdge(): GraphEdge {
    return {
      data: {
        id: this.id,
        source: this.source,
        target: this.target,
        capacity: this.capacity,
        flow: this.flow,
        label: this.label ?? this.formatLabel(),
      },
      classes: this.classes,
    };
  }

  /**
   * Creates a copy of this edge.
   */
  override clone(): MaxFlowEdge {
    return new MaxFlowEdge({
      id: this.id,
      source: this.source,
      target: this.target,
      label: this.label,
      classes: this.classes,
      capacity: this.capacity,
      flow: this.flow,
    });
  }
}
