import type { DirectedGraphEdge, UndirectedGraphEdge } from './types';

export interface EdgeInit {
    id: string;
    label?: string;
    classes?: string;
}

/** An edge in a graph. */
export class Edge {
    /** The ID of the edge. */
    public readonly id: string;
    /** Optional display label of the edge. */
    public label?: string;
    /** Optional class string for visualization styling. */
    public classes?: string;

    constructor(init: EdgeInit) {
        this.id = init.id;
        this.label = init.label;
        this.classes = init.classes;
  }
}

export interface DirectedEdgeInit extends EdgeInit {
    source: string;
    target: string;
}

/** A directed edge in a graph. */
export class DirectedEdge extends Edge {
    public readonly source: string;
    public readonly target: string;

    constructor(init: DirectedEdgeInit) {
        super(init);
        this.source = init.source;
        this.target = init.target;
    }

    /**
     * Converts this edge to UI-friendly `DirectedGraphEdge`.
     */
    toGraphEdge(): DirectedGraphEdge {
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

export interface UndirectedEdgeInit extends EdgeInit {
    u: string;
    v: string;
}

/** An undirected edge in a graph. */
export class UndirectedEdge extends Edge {
    public readonly u: string;
    public readonly v: string;

    constructor(init: UndirectedEdgeInit) {
        super(init);
        this.u = init.u;
        this.v = init.v;
    }

    /**
     * Converts this edge to UI-friendly `UndirectedGraphEdge`.
     */
    toGraphEdge(): UndirectedGraphEdge {
        return {
            data: {
                id: this.id,
                u: this.u,
                v: this.v,
                label: this.label,
            },
            classes: this.classes,
        };
    }

    /**
     * Returns a copy of this edge.
     */
    clone(): UndirectedEdge {
        return new UndirectedEdge({
            id: this.id,
            u: this.u,
            v: this.v,
            label: this.label,
            classes: this.classes,
        });
    }
}
