import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../../app/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../app/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../app/components/ui/select';
import type { BayesNetDataset } from './types';
import { buildBayesNetLayout, formatPercent, summarizeNetwork } from './bayesNet';

const bayesNetModules = import.meta.glob('../../../data/*.json', {
  eager: true,
}) as Record<string, { default: BayesNetDataset }>;

const bayesNetEntries = Object.entries(bayesNetModules)
  .map(([path, module]) => {
    const fileName = path.split('/').pop()?.replace('.json', '') ?? path;
    return { id: fileName, fileName, dataset: module.default };
  })
  .sort((a, b) => a.fileName.localeCompare(b.fileName));

function prettify(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getBoxBoundaryPoint(
  centerX: number,
  centerY: number,
  boxWidth: number,
  boxHeight: number,
  towardX: number,
  towardY: number,
) {
  const dx = towardX - centerX;
  const dy = towardY - centerY;

  if (dx === 0 && dy === 0) {
    return { x: centerX, y: centerY };
  }

  const halfWidth = boxWidth / 2;
  const halfHeight = boxHeight / 2;
  const scaleX = dx === 0 ? Number.POSITIVE_INFINITY : halfWidth / Math.abs(dx);
  const scaleY = dy === 0 ? Number.POSITIVE_INFINITY : halfHeight / Math.abs(dy);
  const scale = Math.min(scaleX, scaleY);

  return {
    x: centerX + dx * scale,
    y: centerY + dy * scale,
  };
}

export function BasicBayesNetView() {
  const [selectedDatasetId, setSelectedDatasetId] = useState(bayesNetEntries[0]?.id ?? '');
  const dataset =
    bayesNetEntries.find((entry) => entry.id === selectedDatasetId)?.dataset ?? bayesNetEntries[0]?.dataset;
  const layout = useMemo(() => (dataset ? buildBayesNetLayout(dataset) : null), [dataset]);
  const summary = useMemo(() => (dataset ? summarizeNetwork(dataset) : null), [dataset]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('');

  useEffect(() => {
    if (!layout?.nodes.length) {
      setSelectedNodeId('');
      return;
    }
    setSelectedNodeId((current) => (layout.nodes.some((node) => node.id === current) ? current : layout.nodes[0].id));
  }, [layout]);

  if (!dataset || !layout) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>No Bayes net datasets found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Add a JSON file to `data/` to populate the Bayes net view.
          </CardContent>
        </Card>
      </div>
    );
  }

  const width = Math.max(layout.width, 1200);
  const height = Math.max(layout.height, 760);
  const diagnosisNodes = layout.nodes.filter((node) => node.kind === 'diagnosis');
  const findingNodes = layout.nodes.filter((node) => node.kind === 'finding');
  const viewWidth = Math.max(width, 1680);
  const viewHeight = Math.max(height + 80, 1120);
  const diagnosisWidth = 320;
  const diagnosisHeight = 154;
  const childWidth = 300;
  const childHeight = 164;
  const leftX = 120;
  const rightX = viewWidth - childWidth - 120;
  const diagnosisStartX = (viewWidth - diagnosisWidth * 2 - 90) / 2;
  const diagnosisStartY = 200;
  const diagnosisColumns = 2;
  const diagnosisRowGap = 44;
  const findingTopPadding = 70;
  const findingGap = 30;
  const leftFindings = findingNodes.filter((_, index) => index % 2 === 0);
  const rightFindings = findingNodes.filter((_, index) => index % 2 === 1);

  const positionedNodes = [
    ...diagnosisNodes.map((node, index) => {
      const col = index % diagnosisColumns;
      const row = Math.floor(index / diagnosisColumns);
      return {
        ...node,
        boxWidth: diagnosisWidth,
        boxHeight: diagnosisHeight,
        x: diagnosisStartX + col * (diagnosisWidth + 90),
        y: diagnosisStartY + row * (diagnosisHeight + diagnosisRowGap),
        centerX: diagnosisStartX + col * (diagnosisWidth + 90) + diagnosisWidth / 2,
        centerY: diagnosisStartY + row * (diagnosisHeight + diagnosisRowGap) + diagnosisHeight / 2,
      };
    }),
    ...leftFindings.map((node, index) => {
      const y = findingTopPadding + index * (childHeight + findingGap);
      return {
        ...node,
        boxWidth: childWidth,
        boxHeight: childHeight,
        x: leftX,
        y,
        centerX: leftX + childWidth / 2,
        centerY: y + childHeight / 2,
      };
    }),
    ...rightFindings.map((node, index) => {
      const y = findingTopPadding + index * (childHeight + findingGap);
      return {
        ...node,
        boxWidth: childWidth,
        boxHeight: childHeight,
        x: rightX,
        y,
        centerX: rightX + childWidth / 2,
        centerY: y + childHeight / 2,
      };
    }),
  ];
  const nodeMap = new Map(positionedNodes.map((node) => [node.id, node]));
  const selectedNode = nodeMap.get(selectedNodeId) ?? positionedNodes[0];

  return (
    <div className="h-full bg-slate-50 flex flex-col overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-4 py-4 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Bayesian Network</h2>
            <p className="text-sm text-slate-600">Generated from the MIMIC-derived Dyspnea dataset.</p>
          </div>

          <div className="w-full lg:w-[280px]">
            <Select value={selectedDatasetId} onValueChange={setSelectedDatasetId}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {bayesNetEntries.map((entry) => (
                  <SelectItem key={entry.id} value={entry.id}>
                    {entry.fileName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {summary && (
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge variant="outline">{summary.nodeCount} nodes</Badge>
            <Badge variant="outline">{summary.edgeCount} edges</Badge>
            <Badge variant="outline">{dataset.network_type}</Badge>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="grid h-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full h-auto">
              <defs>
                <marker id="basic-bn-arrow" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
                  <path d="M0,0 L0,8 L8,4 z" fill="#94a3b8" />
                </marker>
              </defs>

              {layout.edges.map((edge) => {
                const source = nodeMap.get(edge.source);
                const target = nodeMap.get(edge.target);
                if (!source || !target) return null;

                const start = getBoxBoundaryPoint(
                  source.centerX,
                  source.centerY,
                  source.boxWidth,
                  source.boxHeight,
                  target.centerX,
                  target.centerY,
                );
                const end = getBoxBoundaryPoint(
                  target.centerX,
                  target.centerY,
                  target.boxWidth,
                  target.boxHeight,
                  source.centerX,
                  source.centerY,
                );
                const controlX = source.centerX < target.centerX
                  ? (start.x + end.x) / 2 - 40
                  : (start.x + end.x) / 2 + 40;
                const controlY = (start.y + end.y) / 2;
                const curve = `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`;

                return (
                  <path
                    key={`${edge.source}-${edge.target}`}
                    d={curve}
                    fill="none"
                    stroke="rgba(100, 116, 139, 0.55)"
                    strokeWidth={1.5 + edge.strength * 10}
                    markerEnd="url(#basic-bn-arrow)"
                  />
                );
              })}

              {positionedNodes.map((node) => {
                const isSelected = node.id === selectedNode?.id;
                const barWidth = node.kind === 'diagnosis' ? 96 : 118;
                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={() => setSelectedNodeId(node.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <rect
                      width={node.boxWidth}
                      height={node.boxHeight}
                      rx="18"
                      fill={node.kind === 'diagnosis' ? '#eff6ff' : 'white'}
                      stroke={isSelected ? '#2563eb' : node.kind === 'diagnosis' ? '#60a5fa' : '#cbd5e1'}
                      strokeWidth={isSelected ? '3' : '1.5'}
                    />
                    <text x="18" y="34" fontSize={node.kind === 'diagnosis' ? '19' : '18'} fontWeight="600" fill="#0f172a">
                      {node.name}
                    </text>
                    {node.probabilities.slice(0, 3).map((entry, index) => (
                      <g key={`${node.id}-${entry.state}`} transform={`translate(18, ${58 + index * 30})`}>
                        <text x="0" y="16" fontSize="13" fill="#475569">
                          {prettify(entry.state)}
                        </text>
                        <rect x={node.kind === 'diagnosis' ? 90 : 126} y="2" width={barWidth} height="18" rx="5" fill="#e2e8f0" />
                        <rect
                          x={node.kind === 'diagnosis' ? 90 : 126}
                          y="2"
                          width={Math.max(entry.probability * barWidth, 5)}
                          height="18"
                          rx="5"
                          fill="#3b82f6"
                        />
                        <text x={(node.kind === 'diagnosis' ? 90 : 126) + barWidth + 10} y="16" fontSize="13" fill="#334155">
                          {formatPercent(entry.probability)}
                        </text>
                      </g>
                    ))}
                    <text x="18" y={node.boxHeight - 16} fontSize="12" fill="#64748b">
                      {node.kind === 'diagnosis' ? 'Diagnosis node' : 'Top 2 diagnosis links shown'}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="min-h-0 overflow-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="p-4 lg:p-6 space-y-4">
              <Card className="border-slate-200 shadow-none gap-4">
                <CardHeader className="pb-0">
                  <CardTitle className="text-lg">Selected Node</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Name</div>
                    <div className="mt-1 text-xl font-semibold text-slate-900">{selectedNode?.name}</div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{selectedNode?.kind === 'diagnosis' ? 'Diagnosis' : 'Finding'}</Badge>
                    <Badge variant="outline">{selectedNode?.states.length ?? 0} states</Badge>
                    {selectedNode?.parents.length ? (
                      <Badge variant="outline">
                        {selectedNode.kind === 'finding' ? 'Filtered relationships' : `${selectedNode.parents.length} parent nodes`}
                      </Badge>
                    ) : null}
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Parents</div>
                    <div className="mt-2 text-sm text-slate-700">
                      {selectedNode?.parents.length
                        ? selectedNode.parents
                            .filter((parentId) => layout.edges.some((edge) => edge.source === parentId && edge.target === selectedNode.id))
                            .map((parentId) => prettify(parentId.replace('diagnosis:', '')))
                            .join(', ')
                        : 'None'}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Probability Distribution</div>
                    <div className="mt-3 space-y-2">
                      {selectedNode?.probabilities.map((entry) => (
                        <div key={entry.state} className="rounded-lg border border-slate-200 p-3">
                          <div className="mb-2 flex items-center justify-between text-sm">
                            <span className="text-slate-700">{prettify(entry.state)}</span>
                            <span className="font-medium tabular-nums text-slate-900">{formatPercent(entry.probability)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-2 rounded-full bg-blue-500"
                              style={{ width: `${Math.max(entry.probability * 100, 2)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
