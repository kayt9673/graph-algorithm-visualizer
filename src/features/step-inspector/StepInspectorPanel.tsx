import { Settings } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { ScrollArea } from '../../app/components/ui/scroll-area';
import { Separator } from '../../app/components/ui/separator';
import type { AppState } from '../../core/graph/types';
import type { AlgorithmStep } from '../../core/steps/types';

interface StepInspectorPanelProps {
  appState: AppState;
  currentStepData?: AlgorithmStep;
  totalSteps: number;
}

export function StepInspectorPanel({
  appState,
  currentStepData,
  totalSteps,
}: StepInspectorPanelProps) {
  return (
    <div
      className="w-full lg:w-[340px] lg:basis-[340px] lg:flex-shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-card overflow-auto"
      style={{ scrollbarGutter: 'stable' }}
    >
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          <div>
            <h3 className="mb-4">Step Inspector</h3>

            {(appState === 'running' || appState === 'finished') && currentStepData ? (
              <div className="space-y-4">
                <div className="min-h-[160px]">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Step {currentStepData.id + 1} of {totalSteps}</Badge>
                    {appState === 'finished' && <Badge className="bg-[#16a34a] text-white">Complete</Badge>}
                  </div>
                  <h4 className="mb-2">{currentStepData.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{currentStepData.description}</p>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Current Step Flow</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium">{currentStepData.currentFlow ?? 0} units</div></CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Bottleneck</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-medium min-h-[2rem]">
                        {currentStepData.bottleneck !== undefined ? `${currentStepData.bottleneck} units` : '-'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Augmenting Path</CardTitle></CardHeader>
                    <CardContent>
                      <div className="text-base font-medium font-mono min-h-[1.5rem]">
                        {currentStepData.path ? currentStepData.path.join(' -> ') : 'No path in this step'}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="pb-3"><CardTitle className="text-sm">Total Max Flow</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-medium">{currentStepData.totalMaxFlow ?? 0} units</div></CardContent>
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
      </ScrollArea>
    </div>
  );
}
