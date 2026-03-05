import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import type { GraphElement } from '../../core/graph/types';
import { CYTOSCAPE_LAYOUT, CYTOSCAPE_STYLE } from './cytoscapeStyles';

interface CytoscapeCanvasProps {
  elements: GraphElement[];
  className?: string;
  onReady?: (cy: cytoscape.Core) => void;
}

export function CytoscapeCanvas({ elements, className = '', onReady }: CytoscapeCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: CYTOSCAPE_STYLE,
      layout: CYTOSCAPE_LAYOUT,
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;
    onReady?.(cy);

    return () => {
      cy.destroy();
    };
  }, []);

  useEffect(() => {
    if (!cyRef.current) return;
    cyRef.current.elements().remove();
    cyRef.current.add(elements as any);
    cyRef.current.layout({ name: 'cose', fit: true, padding: 30 } as any).run();
  }, [elements]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
