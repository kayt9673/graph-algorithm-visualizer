import { useEffect, useRef } from 'react';
import { Maximize2, ZoomIn, ZoomOut } from 'lucide-react';
import type cytoscape from 'cytoscape';
import type { AppState, GraphElement } from '../../core/graph/types';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Switch } from '../../app/components/ui/switch';
import { CytoscapeCanvas } from './CytoscapeCanvas';

interface GraphCanvasPanelProps {
  appState: AppState;
  normalElements: GraphElement[];
  residualElements: GraphElement[];
  showResidual: boolean;
  onShowResidualChange: (value: boolean) => void;
  onReady: (cy: cytoscape.Core) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

export function GraphCanvasPanel({
  appState,
  normalElements,
  residualElements,
  showResidual,
  onShowResidualChange,
  onReady,
  onZoomIn,
  onZoomOut,
  onFit,
}: GraphCanvasPanelProps) {
  const normalCyRef = useRef<cytoscape.Core | null>(null);
  const residualCyRef = useRef<cytoscape.Core | null>(null);

  const showSplitView = showResidual;
  const shouldSyncResidualView = appState === 'running' || appState === 'finished';

  const syncResidualPositions = () => {
    const normalCy = normalCyRef.current;
    const residualCy = residualCyRef.current;
    if (!normalCy || !residualCy || normalCy.destroyed() || residualCy.destroyed()) return;

    residualCy.batch(() => {
      residualCy.nodes().forEach((residualNode) => {
        const normalNode = normalCy.getElementById(residualNode.id());
        if (normalNode.length > 0) {
          residualNode.position(normalNode.position());
        }
      });
    });

    residualCy.zoom(normalCy.zoom());
    residualCy.pan(normalCy.pan());
  };

  const isNormalLayoutReady = () => {
    const normalCy = normalCyRef.current;
    if (!normalCy || normalCy.destroyed()) return false;

    const nodes = normalCy.nodes();
    if (nodes.length <= 1) return true;

    const box = nodes.boundingBox();
    return box.w > 1 || box.h > 1;
  };

  const syncResidualPositionsWithRetry = (attempt = 0) => {
    if (isNormalLayoutReady()) {
      syncResidualPositions();
      return;
    }

    if (attempt >= 30) return;
    requestAnimationFrame(() => syncResidualPositionsWithRetry(attempt + 1));
  };

  useEffect(() => {
    if (!showSplitView || !shouldSyncResidualView) return;
    const frameA = requestAnimationFrame(() => {
      syncResidualPositions();
      // A second frame catches cases where normal layout settles one tick later.
      requestAnimationFrame(syncResidualPositions);
    });

    return () => cancelAnimationFrame(frameA);
  }, [showSplitView, shouldSyncResidualView, normalElements, residualElements]);

  useEffect(() => {
    if (!showSplitView) {
      residualCyRef.current = null;
    }
  }, [showSplitView]);

  const handleNormalReady = (cy: cytoscape.Core) => {
    normalCyRef.current = cy;
    onReady(cy);
    if (showSplitView) {
      requestAnimationFrame(() => syncResidualPositionsWithRetry());
    }
  };

  const handleResidualReady = (cy: cytoscape.Core) => {
    residualCyRef.current = cy;
    if (shouldSyncResidualView) {
      requestAnimationFrame(() => syncResidualPositionsWithRetry());
      return;
    }

    requestAnimationFrame(() => syncResidualPositionsWithRetry());
  };

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
        </div>
      </div>

      <div className="flex-1 relative p-4 lg:p-6 min-h-[400px]">
        <div className="absolute inset-4 lg:inset-6 border border-border rounded-lg bg-background overflow-hidden">
          {showSplitView ? (
            <div className="h-full grid grid-cols-1 xl:grid-cols-2">
              <div className="min-h-0 border-b xl:border-b-0 xl:border-r border-border">
                <div className="px-3 py-2 text-xs font-medium border-b border-border bg-muted/40">Flow Graph</div>
                <div className="h-[calc(100%-73px)]">
                  <CytoscapeCanvas elements={normalElements} onReady={handleNormalReady} />
                </div>
                <div className="h-10 px-3 border-t border-border bg-card/80 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-medium">Legend:</span>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#2563eb]" /><span>Normal</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#16a34a]" /><span>Augmenting Path</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#dc2626]" /><span>Saturated</span></div>
                  <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#f59e0b]" /><span>Changed</span></div>
                </div>
              </div>
                <div className="min-h-0">
                  <div className="px-3 py-2 text-xs font-medium border-b border-border bg-muted/40">Residual Graph</div>
                  <div className="h-[calc(100%-73px)]">
                    {residualElements.length > 0 ? (
                      <CytoscapeCanvas
                        elements={residualElements}
                        onReady={handleResidualReady}
                        disableAutoLayout
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
                        Run the algorithm to populate the residual graph.
                      </div>
                    )}
                  </div>
                  <div className="h-10 px-3 border-t border-border bg-card/80 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-medium">Legend:</span>
                    <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 border-t-2 border-dashed border-[#9ca3af]" /><span>Residual</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 border-t-2 border-dashed border-[#22c55e]" /><span>Forward Edge</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 border-t-2 border-dashed border-[#f97316]" /><span>Backward Edge</span></div>
                  </div>
                </div>
              </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                <CytoscapeCanvas elements={normalElements} onReady={handleNormalReady} />
              </div>
              <div className="h-10 px-3 border-t border-border bg-card/80 flex flex-wrap items-center gap-3 text-xs">
                <span className="font-medium">Legend:</span>
                <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#2563eb]" /><span>Normal</span></div>
                <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#16a34a]" /><span>Augmenting Path</span></div>
                <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#dc2626]" /><span>Saturated</span></div>
                <div className="flex items-center gap-1.5"><div className="w-6 h-0.5 bg-[#f59e0b]" /><span>Changed</span></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
