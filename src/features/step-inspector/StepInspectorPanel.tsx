import { Settings } from 'lucide-react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Separator } from '../../app/components/ui/separator';
import type { AppState, GraphEdge, GraphElement } from '../../core/graph/types';
import type { MaxFlowAlgorithmStep, ShortestPathAlgorithmStep } from '../../core/steps/types';

interface StepInspectorPanelProps {
  appState: AppState;
  currentStepData?: MaxFlowAlgorithmStep | ShortestPathAlgorithmStep;
  totalSteps: number;
  selectedAlgorithm: string;
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

function isShortestPathStep(step: MaxFlowAlgorithmStep | ShortestPathAlgorithmStep): step is ShortestPathAlgorithmStep {
  return 'distances' in step && 'frontier' in step && 'discovered' in step;
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

function formatDistance(value: number): string {
  return Number.isFinite(value) ? `${value}` : 'INF';
}

function renderNodeTokens(text: string): JSX.Element {
  const parts = text.split(/(\[[^\]]+\])/g);
  return (
    <>
      {parts.map((part, index) => {
        if (part.startsWith('[') && part.endsWith(']')) {
          const nodeId = part.slice(1, -1);
          return (
            <span key={`${nodeId}-${index}`} className="font-mono font-medium text-foreground">
              {nodeId}
            </span>
          );
        }
        return <span key={`txt-${index}`}>{part}</span>;
      })}
    </>
  );
}

function normalizeNodeReferences(text: string): string {
  let normalized = text;
  normalized = normalized.replace(/([A-Za-z0-9_]+)\s*->\s*([A-Za-z0-9_]+)/g, (_match, a, b) => {
    return `[${String(a).toLowerCase()}] -> [${String(b).toLowerCase()}]`;
  });
  normalized = normalized.replace(/from\s+([A-Za-z0-9_]+)\s+to\s+([A-Za-z0-9_]+)/gi, (_match, a, b) => {
    return `from [${String(a).toLowerCase()}] to [${String(b).toLowerCase()}]`;
  });
  return normalized;
}

function renderMaxFlowDescription(text: string): JSX.Element {
  return (
    <p className="text-sm text-muted-foreground leading-relaxed">
      {renderNodeTokens(normalizeNodeReferences(text))}
    </p>
  );
}

function renderShortestPathInspector(step: ShortestPathAlgorithmStep) {
  const isBellmanFord = step.shortestPathAlgorithm === 'bellman-ford';
  const vertexOrder = Object.keys(step.distances);
  const frontier = new Set(step.frontier);
  const discovered = new Set(step.discovered);
  const labelOf = (nodeId: string) => step.nodeLabels[nodeId] ?? nodeId;
  const isDoneStep = step.title === 'Done';
  const hasNegativeCycle = Boolean(step.hasNegativeCycle);
  const negativeCycleNodes = step.negativeCycleNodes ?? [];

  const buildPathTo = (target: string): string[] | null => {
    if (!Number.isFinite(step.distances[target])) return null;

    const path: string[] = [];
    const seen = new Set<string>();
    let current: string | null = target;

    while (current) {
      if (seen.has(current)) return null;
      seen.add(current);
      path.push(current);
      if (current === step.source) break;
      current = step.previous[current] ?? null;
    }

    if (path[path.length - 1] !== step.source) return null;
    return path.reverse();
  };

  const columnClass = (nodeId: string): string => {
    if (step.current === nodeId) return 'bg-emerald-200/80';
    if (discovered.has(nodeId)) return 'bg-rose-200/80';
    if (frontier.has(nodeId)) return 'bg-amber-200/80';
    return '';
  };

  return (
    <>
      <Separator />
      <Card className="gap-1">
        <CardHeader className="px-3 pt-2 pb-0">
          <CardTitle className="text-base">{isBellmanFord ? 'Distance Table' : 'Settled'}</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pb-3 pt-1 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <tbody>
              <tr className="border-b border-border">
                <th className="text-left font-medium py-1 pr-2">vertex</th>
                {vertexOrder.map((v) => <td key={`vertex-${v}`} className={`py-1 px-2 font-mono ${columnClass(v)}`}>{labelOf(v)}</td>)}
              </tr>
              <tr className="border-b border-border">
                <th className="text-left font-medium py-1 pr-2">distance</th>
                {vertexOrder.map((v) => <td key={`dist-${v}`} className={`py-1 px-2 font-mono ${columnClass(v)}`}>{formatDistance(step.distances[v])}</td>)}
              </tr>
              <tr>
                <th className="text-left font-medium py-1 pr-2">prev</th>
                {vertexOrder.map((v) => {
                  const predecessor = step.previous[v];
                  return (
                    <td key={`prev-${v}`} className={`py-1 px-2 font-mono ${columnClass(v)}`}>
                      {predecessor ? labelOf(predecessor) : 'null'}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
      {!isDoneStep && (
        <Card className="gap-1">
          <CardHeader className="px-3 pt-2 pb-0">
            <CardTitle className="text-base">Distance Changes</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-1">
            {step.distanceChanges && step.distanceChanges.length > 0 ? (
              <div className="space-y-1.5 text-sm leading-snug">
                {step.distanceChanges.map((change, index) => (
                  <div key={`${change.from}-${change.to}-${index}`} className="rounded-md border border-border/80 p-1.5">
                    <div className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold tracking-tight text-primary">
                      {labelOf(change.from)} -&gt; {labelOf(change.to)}
                    </div>
                    <ul className="mt-0.5 list-disc pl-4 text-muted-foreground space-y-0.5">
                      <li>
                        <span className="font-mono text-foreground">dist({labelOf(change.from)})</span>
                        {' + '}
                        <span className="font-mono text-foreground">weight</span>
                        {' = '}
                        {formatDistance(change.baseDistance)}
                        {' + '}
                        {change.weight}
                        {' = '}
                        {formatDistance(change.candidate)}
                        {' '}
                        {change.updated ? '<' : '>='}
                        {' '}
                        <span className="font-mono text-foreground">dist({labelOf(change.to)})</span>
                        {' = '}
                        {formatDistance(change.previousDistance)}
                      </li>
                      <li>
                        {change.updated ? (
                          <>
                            {'update '}
                            <span className="font-mono text-foreground">dist({labelOf(change.to)})</span>
                            {' = '}
                            {formatDistance(change.nextDistance)}
                            {' and '}
                            <span className="font-mono text-foreground">prev({labelOf(change.to)})</span>
                            {' = '}
                            <span className="font-mono text-foreground">{labelOf(change.from)}</span>
                          </>
                        ) : (
                          'no update'
                        )}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No distance changes.</div>
            )}
          </CardContent>
        </Card>
      )}
      {!isBellmanFord && !isDoneStep && (
        <Card className="gap-1">
          <CardHeader className="px-3 pt-2 pb-0">
            <CardTitle className="text-base">Frontier</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
              <div className="text-base font-medium font-mono leading-snug">
              {step.frontier.length > 0 ? step.frontier.map((nodeId) => labelOf(nodeId)).join('  ') : '(empty)'}
            </div>
          </CardContent>
        </Card>
      )}
      {isDoneStep && (
        <Card className="gap-1">
          <CardHeader className="px-3 pt-2 pb-0">
            <CardTitle className="text-base">Final Shortest Paths</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-1">
            <div className="space-y-1.5 text-sm leading-snug">
              {vertexOrder.map((nodeId) => {
                const path = buildPathTo(nodeId);
                const distance = step.distances[nodeId];
                return (
                  <div key={`final-path-${nodeId}`} className="rounded-md border border-border/80 p-1.5">
                    <div className="font-mono text-foreground">{labelOf(step.source)} -&gt; {labelOf(nodeId)}</div>
                    <div className="text-muted-foreground">
                      <span className="text-foreground">Path</span>
                      {': '}
                      <span className="font-mono text-foreground">
                        {path
                          ? path.map((id) => labelOf(id)).join(' -> ')
                          : Number.isFinite(distance) && hasNegativeCycle
                            ? 'undefined (affected by negative cycle)'
                            : 'unreachable'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="text-foreground">Distance</span>
                      {': '}
                      <span className="font-mono text-foreground">{formatDistance(distance)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      {isDoneStep && hasNegativeCycle && negativeCycleNodes.length > 1 && (
        <Card className="gap-1">
          <CardHeader className="px-3 pt-2 pb-0">
            <CardTitle className="text-base">Negative Cycle</CardTitle>
          </CardHeader>
          <CardContent className="px-3 pb-3 pt-1 text-sm text-muted-foreground">
            <div>
              Reachable cycle:
              {' '}
              <span className="font-mono text-foreground">
                {negativeCycleNodes.map((id) => labelOf(id)).join(' -> ')}
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function renderMaxFlowInspector(step: MaxFlowAlgorithmStep) {
  const residualChanges = getResidualChanges(step);

  return (
    <>
      <Separator />
      <div className="space-y-1.5 min-h-0 flex-1">
        <Card className="gap-1">
          <CardHeader className="px-3 pt-2 pb-0"><CardTitle className="text-base">Augmenting Path</CardTitle></CardHeader>
          <CardContent className="px-3 pb-3 pt-0">
            <div className="text-base font-medium font-mono leading-snug">
              {step.path ? step.path.join(' -> ') : 'No path in this step'}
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
                    <div className="inline-flex items-center rounded-sm border border-primary/40 bg-primary/10 px-2 py-0.5 font-mono text-sm font-semibold tracking-tight text-primary">
                      {change.edge}
                    </div>
                    <ul className="mt-0.5 list-disc pl-4 text-muted-foreground space-y-0.5">
                      <li>Capacity = {change.capacity}</li>
                      <li>Flow = {change.flow}</li>
                    </ul>
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
          <CardContent className="px-3 pb-3 pt-0"><div className="text-lg font-medium">{step.totalMaxFlow ?? 0} units</div></CardContent>
        </Card>
      </div>
    </>
  );
}

export function StepInspectorPanel({
  appState,
  currentStepData,
  totalSteps,
  selectedAlgorithm,
}: StepInspectorPanelProps) {
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
                {selectedAlgorithm === 'shortest-paths' && isShortestPathStep(currentStepData) ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">{renderNodeTokens(currentStepData.description)}</p>
                ) : (
                  renderMaxFlowDescription(currentStepData.description)
                )}
              </div>

              {selectedAlgorithm === 'shortest-paths' && isShortestPathStep(currentStepData)
                ? renderShortestPathInspector(currentStepData)
                : renderMaxFlowInspector(currentStepData as MaxFlowAlgorithmStep)}
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
