import type { GraphEdge } from './types';

export interface DirectedEdgeInit {
  id: string;
  source: string;
  target: string;
  label?: string;
  classes?: string;
}

export class DirectedEdge {
  public readonly id: string;
  public readonly source: string;
  public readonly target: string;
  public label?: string;
  public classes?: string;

  constructor(init: DirectedEdgeInit) {
    this.id = init.id;
    this.source = init.source;
    this.target = init.target;
    this.label = init.label;
    this.classes = init.classes;
  }

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
