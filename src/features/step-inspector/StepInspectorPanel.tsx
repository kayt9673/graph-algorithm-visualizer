import { Settings } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Separator } from '../../app/components/ui/separator';
import type { AppState, GraphEdge, GraphElement } from '../../core/graph/types';
import type { MaxFlowAlgorithmStep } from '../../core/steps/types';

interface StepInspectorPanelProps {
  appState: AppState;
  currentStepData?: MaxFlowAlgorithmStep;
  totalSteps: number;
}

interface ResidualChange {
  edge: string;
  capacity: number;
  flow: number;
  forwardResidual: number;
  backwardResidual: number;
}

function isEdgeElement(element: GraphElement): element is GraphEdge {
  return 'source' in element.data && 'target' in element.data;
}

function getResidualChanges(step: MaxFlowAlgorithmStep): ResidualChange[] {
  const path = step.path;
  if (!path || path.length < 2) return [];

  const edgeByPair = new Map<string, GraphEdge>();
  for (const element of step.elements) {
    if (!isEdgeElement(element)) continue;
    edgeByPair.set(`${element.data.source}->${element.data.target}`, element);
  }

  return path
    .slice(0, -1)
    .map((node, index) => {
      const source = node;
      const target = path[index + 1];
      const edge = edgeByPair.get(`${source}->${target}`);
      if (!edge) return undefined;

      const capacity = edge.data.capacity ?? 0;
      const flow = edge.data.flow ?? 0;

      return {
        edge: `${source} -> ${target}`,
        capacity,
        flow,
        forwardResidual: capacity - flow,
        backwardResidual: Math.max(0, flow),
      };
    })
    .filter((change): change is ResidualChange => Boolean(change));
}

export function StepInspectorPanel({
  appState,
  currentStepData,
  totalSteps,
}: StepInspectorPanelProps) {
  const residualChanges = currentStepData ? getResidualChanges(currentStepData) : [];

  return (
    <div
      className="w-full lg:w-[380px] lg:basis-[380px] lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card overflow-y-auto"
      style={{ scrollbarGutter: 'stable' }}
    >
      <div className="h-full p-3 space-y-2 flex flex-col min-h-0">
          <div className="min-h-0 flex flex-col">
            <h3 className="mb-2 text-lg">Step Inspector</h3>

            {(appState === 'running' || appState === 'finished') && currentStepData ? (
              <div className="space-y-2 min-h-0 flex flex-col">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <Badge variant="outline">Step {currentStepData.id + 1} of {totalSteps}</Badge>
                      {appState === 'finished' && <Badge className="bg-[#16a34a] text-white">Complete</Badge>}
                    </div>
                  <h4 className="mb-1 text-base">{currentStepData.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentStepData.description}</p>
                </div>

                <Separator />

                <div className="space-y-1.5 min-h-0 flex-1">
                  <Card className="gap-1">
                    <CardHeader className="px-3 pt-2 pb-0"><CardTitle className="text-base">Augmenting Path</CardTitle></CardHeader>
                    <CardContent className="px-3 pb-3 pt-0">
                      <div className="text-base font-medium font-mono leading-snug">
                        {currentStepData.path ? currentStepData.path.join(' -> ') : 'No path in this step'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="gap-1 min-h-0">
                    <CardHeader className="px-3 pt-2 pb-0"><CardTitle className="text-base">Residual Graph Changes</CardTitle></CardHeader>
                    <CardContent className="px-3 pb-2 pt-0 min-h-0 overflow-y-auto">
                      {residualChanges.length > 0 ? (
                        <div className="space-y-1.5 text-sm leading-snug">
                          {residualChanges.map((change) => (
                            <div key={change.edge} className="rounded-md border border-border/80 p-1.5">
                              <div className="font-mono text-sm">{change.edge}</div>
                              <ul className="mt-0.5 list-disc pl-4 text-muted-foreground space-y-0.5">
                                <li>Capacity = {change.capacity}</li>
                                <li>Flow = {change.flow}</li>
                              </ul>
                              <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                                <div className="rounded-sm border border-border/70 p-1">
                                  <div className="font-medium text-sm">Forward Edge</div>
                                  <div className="text-muted-foreground">
                                    {change.forwardResidual > 0
                                      ? `${change.capacity} - ${change.flow} = ${change.forwardResidual}`
                                      : 'No forward edge'}
                                  </div>
                                </div>
                                <div className="rounded-sm border border-border/70 p-1">
                                  <div className="font-medium text-sm">Backward Edge</div>
                                  <div className="text-muted-foreground">
                                    {change.backwardResidual > 0 ? `${change.backwardResidual}` : 'No backward edge'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No residual updates in this step.</div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground gap-1">
                    <CardHeader className="px-3 pt-2 pb-0"><CardTitle className="text-base">Total Max Flow</CardTitle></CardHeader>
                    <CardContent className="px-3 pb-3 pt-0"><div className="text-lg font-medium">{currentStepData.totalMaxFlow ?? 0} units</div></CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Configure your graph and click Run to start visualization</p>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
