import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { GraphElement } from '../../core/graph/types';
import { CYTOSCAPE_LAYOUT, CYTOSCAPE_STYLE } from './cytoscapeStyles';

interface CytoscapeCanvasProps {
  elements: GraphElement[];
  className?: string;
  onReady?: (cy: cytoscape.Core) => void;
  disableAutoLayout?: boolean;
}

function isEdgeElement(element: GraphElement): boolean {
  return 'source' in element.data && 'target' in element.data;
}

function getNodeTopologyKey(elements: GraphElement[]): string {
  const tokens = elements.map((element) => {
    if (isEdgeElement(element)) return null;
    return `n:${element.data.id}`;
  });
  return tokens
    .filter((token): token is string => token !== null)
    .sort()
    .join('|');
}

function applyEdgeLabelLayout(cy: cytoscape.Core): void {
  const groups = new Map<string, cytoscape.EdgeSingular[]>();

  cy.edges().forEach((edge) => {
    const source = edge.source().id();
    const target = edge.target().id();
    const key = source < target ? `${source}|${target}` : `${target}|${source}`;
    const bucket = groups.get(key) ?? [];
    bucket.push(edge);
    groups.set(key, bucket);
  });

  groups.forEach((edges) => {
    const forward: cytoscape.EdgeSingular[] = [];
    const backward: cytoscape.EdgeSingular[] = [];

    if (edges.length === 0) return;
    const a = edges[0].source().id() < edges[0].target().id() ? edges[0].source().id() : edges[0].target().id();
    const b = edges[0].source().id() < edges[0].target().id() ? edges[0].target().id() : edges[0].source().id();

    edges.forEach((edge) => {
      if (edge.source().id() === a && edge.target().id() === b) forward.push(edge);
      else backward.push(edge);
    });

    const layoutOneDirection = (items: cytoscape.EdgeSingular[], sign: number) => {
      items.forEach((edge, index) => {
        const center = (items.length - 1) / 2;
        const spread = (index - center) * 11;
        const offsetY = sign * (12 + Math.abs(spread));
        const offsetX = spread;
        edge.style('text-margin-y', `${offsetY}px`);
        edge.style('text-margin-x', `${offsetX}px`);
      });
    };

    layoutOneDirection(forward, 1);
    layoutOneDirection(backward, -1);
  });
}

export function CytoscapeCanvas({
  elements,
  className = '',
  onReady,
  disableAutoLayout = false,
}: CytoscapeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const previousStructureKeyRef = useRef<string>('');

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: CYTOSCAPE_STYLE,
      layout: disableAutoLayout ? ({ name: 'preset', fit: false } as any) : CYTOSCAPE_LAYOUT,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;
    previousStructureKeyRef.current = getNodeTopologyKey(elements);
    applyEdgeLabelLayout(cy);
    onReady?.(cy);

    return () => {
      cy.destroy();
    };
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const nextById = new Map(elements.map((element) => [element.data.id, element]));

    cy.batch(() => {
      const currentElements = cy.elements();

      currentElements.forEach((element) => {
        const id = element.id();
        const next = nextById.get(id);

        if (!next) {
          element.remove();
          return;
        }

        element.data({ ...next.data } as any);
        element.classes(next.classes ?? '');
        nextById.delete(id);
      });

      if (nextById.size > 0) {
        cy.add(Array.from(nextById.values()) as any);
      }
    });
    applyEdgeLabelLayout(cy);

    const nextStructureKey = getNodeTopologyKey(elements);
    const nodeTopologyChanged = nextStructureKey !== previousStructureKeyRef.current;
    previousStructureKeyRef.current = nextStructureKey;

    if (nodeTopologyChanged && !disableAutoLayout) {
      cy.layout({ name: 'cose', fit: true, padding: 30, animate: false } as any).run();
    }
  }, [elements, disableAutoLayout]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
