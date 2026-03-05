import { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';

interface CytoscapeGraphProps {
  elements: any[];
  className?: string;
  onReady?: (cy: cytoscape.Core) => void;
}

export function CytoscapeGraph({ elements, className = '', onReady }: CytoscapeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Cytoscape
    const cy = cytoscape({
      container: containerRef.current,
      elements: elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#2563eb',
            'label': 'data(label)',
            'color': '#030213',
            'text-valign': 'center',
            'text-halign': 'center',
            'width': 40,
            'height': 40,
            'font-size': '14px',
            'font-weight': '500',
          }
        },
        {
          selector: 'node.source',
          style: {
            'background-color': '#16a34a',
            'border-width': 3,
            'border-color': '#15803d',
          }
        },
        {
          selector: 'node.sink',
          style: {
            'background-color': '#dc2626',
            'border-width': 3,
            'border-color': '#b91c1c',
          }
        },
        {
          selector: 'node.active',
          style: {
            'background-color': '#f59e0b',
            'border-width': 4,
            'border-color': '#d97706',
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#2563eb',
            'target-arrow-color': '#2563eb',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'label': 'data(label)',
            'font-size': '12px',
            'text-background-color': '#ffffff',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
          }
        },
        {
          selector: 'edge.augmenting',
          style: {
            'line-color': '#16a34a',
            'target-arrow-color': '#16a34a',
            'width': 4,
          }
        },
        {
          selector: 'edge.saturated',
          style: {
            'line-color': '#dc2626',
            'target-arrow-color': '#dc2626',
            'width': 4,
          }
        },
        {
          selector: 'edge.residual',
          style: {
            'line-color': '#9ca3af',
            'target-arrow-color': '#9ca3af',
            'line-style': 'dashed',
            'width': 2,
          }
        },
        {
          selector: 'edge.active',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 5,
          }
        },
      ],
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
    });

    cyRef.current = cy;
    
    if (onReady) {
      onReady(cy);
    }

    return () => {
      cy.destroy();
    };
  }, []);

  // Update elements when they change
  useEffect(() => {
    if (cyRef.current && elements) {
      cyRef.current.elements().remove();
      cyRef.current.add(elements);
      cyRef.current.layout({ name: 'cose', fit: true, padding: 30 } as any).run();
    }
  }, [elements]);

  return (
    <div 
      ref={containerRef} 
      className={className}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
