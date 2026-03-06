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

    const nextStructureKey = getNodeTopologyKey(elements);
    const nodeTopologyChanged = nextStructureKey !== previousStructureKeyRef.current;
    previousStructureKeyRef.current = nextStructureKey;

    if (nodeTopologyChanged && !disableAutoLayout) {
      cy.layout({ name: 'cose', fit: true, padding: 30, animate: false } as any).run();
    }
  }, [elements, disableAutoLayout]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
