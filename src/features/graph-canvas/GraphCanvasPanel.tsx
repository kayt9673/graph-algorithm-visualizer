import { Info, Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type cytoscape from 'cytoscape';
import type { AppState, GraphElement } from '../../core/graph/types';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import { CytoscapeCanvas } from './CytoscapeCanvas';

interface GraphCanvasPanelProps {
  appState: AppState;
  elements: GraphElement[];
  showResidual: boolean;
  onShowResidualChange: (value: boolean) => void;
  showEdgeLabels: boolean;
  onShowEdgeLabelsChange: (value: boolean) => void;
  showNodeIds: boolean;
  onShowNodeIdsChange: (value: boolean) => void;
  onReady: (cy: cytoscape.Core) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function GraphCanvasPanel({
  appState,
  elements,
  showResidual,
  onShowResidualChange,
  showEdgeLabels,
  onShowEdgeLabelsChange,
  showNodeIds,
  onShowNodeIdsChange,
  onReady,
  onZoomIn,
  onZoomOut,
  onFit,
}: GraphCanvasPanelProps) {
  return (
    <div className="flex-1 flex flex-col bg-muted/20">
      <div className="border-b border-border bg-card px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={onZoomIn}><ZoomIn className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={onZoomOut}><ZoomOut className="h-4 w-4" /></Button>
          <Button size="icon" variant="outline" onClick={onFit}><Maximize2 className="h-4 w-4" /></Button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Switch id="residual" checked={showResidual} onCheckedChange={onShowResidualChange} />
            <Label htmlFor="residual" className="text-sm cursor-pointer whitespace-nowrap">Show Residual Graph</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="edge-labels" checked={showEdgeLabels} onCheckedChange={onShowEdgeLabelsChange} />
            <Label htmlFor="edge-labels" className="text-sm cursor-pointer whitespace-nowrap">Show Edge Labels</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch id="node-ids" checked={showNodeIds} onCheckedChange={onShowNodeIdsChange} />
            <Label htmlFor="node-ids" className="text-sm cursor-pointer whitespace-nowrap">Show Node IDs</Label>
          </div>
        </div>
      </div>

      <div className="flex-1 relative p-4 lg:p-6 min-h-[400px]">
        <div className="absolute inset-4 lg:inset-6 border border-border rounded-lg bg-background overflow-hidden">
          {appState === 'empty' ? (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Info className="h-12 w-12 mx-auto opacity-50" />
                <p>No graph loaded</p>
                <p className="text-sm">Select an example or add nodes and edges</p>
              </div>
            </div>
          ) : (
            <CytoscapeCanvas elements={elements} onReady={onReady} />
          )}
        </div>
      </div>

      <div className="border-t border-border bg-card px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-[#2563eb]" /><span className="text-xs">Normal</span></div>
          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-[#16a34a]" /><span className="text-xs">Augmenting Path</span></div>
          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-[#dc2626]" /><span className="text-xs">Saturated</span></div>
          <div className="flex items-center gap-2"><div className="w-8 h-0.5 border-t-2 border-dashed border-[#9ca3af]" /><span className="text-xs">Residual</span></div>
          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-[#f59e0b]" /><span className="text-xs">Active</span></div>
        </div>
      </div>
    </div>
  );
}
