import { useCallback, useEffect, useRef, useState } from 'react';
import type cytoscape from 'cytoscape';
import { HeaderBar } from './layout/HeaderBar';
import { ThreePanelLayout } from './layout/ThreePanelLayout';
import { GraphCanvasPanel } from '../features/graph-canvas/GraphCanvasPanel';
import { StepInspectorPanel } from '../features/step-inspector/StepInspectorPanel';
import { PlaybackControls } from '../features/playback/PlaybackControls';
import { usePlayback } from '../features/playback/usePlayback';
import { emitFordFulkersonSteps } from '../core/algorithms/maxflow';
import { emitBellmanFordSteps, emitDijkstraSteps } from '../core/algorithms/shortest-path';
import type { MaxFlowAlgorithmStep, ShortestPathAlgorithmStep } from '../core/steps/types';
import type { AppState, FlowNetworkGraph, GraphElement, ShortestPathGraph } from '../core/graph/types';

type GraphComplexity = 'simple' | 'complex';
type ShortestPathChoice = 'bellman-ford' | 'dijkstra';

interface GraphGenerationOptions {
  preferCycles?: boolean;
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickDistinctRandom<T>(items: T[], count: number): T[] {
  const pool = [...items];
  const picked: T[] = [];

  while (pool.length > 0 && picked.length < count) {
    const idx = randomInt(0, pool.length - 1);
    picked.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picked;
}

function buildGeneratedNodes(complexity: GraphComplexity) {
  const intermediateCount = complexity === 'simple' ? randomInt(2, 3) : randomInt(3, 4);
  const nodeIds = 'abcdefghijklmnopqrstuvwxyz'.split('').slice(0, intermediateCount);

  return [
    { data: { id: 's', label: 's' }, classes: 'source' },
    ...nodeIds.map((id) => ({ data: { id, label: id } })),
    { data: { id: 't', label: 't' }, classes: 'sink' },
  ];
}

function labelForIndex(index: number): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz';
  if (index < alphabet.length) return alphabet[index];
  return `n${index + 1}`;
}

function buildBellmanFordWeightMap(graph: FlowNetworkGraph): Map<string, number> {
  const weights = new Map<string, number>();

  for (const edge of graph.edges) {
    const capacity = edge.data.capacity ?? 1;
    const derived = (capacity % 19) - 6;
    weights.set(edge.data.id, derived);
  }

  if (![...weights.values()].some((weight) => weight < 0)) {
    const firstEdge = graph.edges[0];
    if (firstEdge) {
      weights.set(firstEdge.data.id, -3);
    }
  }

  const pairToId = new Map<string, string>();
  for (const edge of graph.edges) {
    pairToId.set(`${edge.data.source}->${edge.data.target}`, edge.data.id);
  }

  const reversePairs: Array<[string, string]> = [];
  for (const edge of graph.edges) {
    const reverseId = pairToId.get(`${edge.data.target}->${edge.data.source}`);
    if (!reverseId) continue;
    reversePairs.push([edge.data.id, reverseId]);
  }

  if (reversePairs.length > 0 && Math.random() < 0.75) {
    const [edgeId, reverseId] = reversePairs[randomInt(0, reversePairs.length - 1)];
    weights.set(edgeId, -4);
    weights.set(reverseId, -3);
  }

  return weights;
}

function generateGraphByComplexity(complexity: GraphComplexity, options: GraphGenerationOptions = {}): FlowNetworkGraph {
  const preferCycles = Boolean(options.preferCycles);
  const nodes = buildGeneratedNodes(complexity);
  const intermediateIds = nodes
    .map((node) => node.data.id)
    .filter((id) => id !== 's' && id !== 't');
  const edgePairs = new Set<string>();
  const capacityRange = complexity === 'simple' ? [4, 14] : [5, 18];
  const edgeTargetCount = complexity === 'simple' ? randomInt(4, 6) : randomInt(6, 9);

  const addEdge = (source: string, target: string) => {
    if (source === target) return;
    if (source === 't' || target === 's') return;
    edgePairs.add(`${source}->${target}`);
  };

  const guaranteedPathLen = randomInt(1, Math.min(3, intermediateIds.length));
  const guaranteedPathNodes = pickDistinctRandom(intermediateIds, guaranteedPathLen)
    .sort((a, b) => intermediateIds.indexOf(a) - intermediateIds.indexOf(b));

  if (guaranteedPathNodes.length > 0) {
    addEdge('s', guaranteedPathNodes[0]);
    for (let i = 0; i < guaranteedPathNodes.length - 1; i += 1) {
      addEdge(guaranteedPathNodes[i], guaranteedPathNodes[i + 1]);
    }
    addEdge(guaranteedPathNodes[guaranteedPathNodes.length - 1], 't');
  }

  for (const id of intermediateIds) {
    if (Math.random() < 0.7) addEdge('s', id);
    if (Math.random() < 0.7) addEdge(id, 't');
  }

  for (let i = 0; i < intermediateIds.length; i += 1) {
    for (let j = i + 1; j < intermediateIds.length; j += 1) {
      if (Math.random() < (preferCycles ? (complexity === 'simple' ? 0.3 : 0.4) : (complexity === 'simple' ? 0.2 : 0.3))) {
        addEdge(intermediateIds[i], intermediateIds[j]);
      }
      if (Math.random() < (preferCycles ? (complexity === 'simple' ? 0.18 : 0.28) : (complexity === 'simple' ? 0.05 : 0.12))) {
        addEdge(intermediateIds[j], intermediateIds[i]);
      }
    }
  }

  if (preferCycles && intermediateIds.length >= 2 && Math.random() < 0.7) {
    const first = intermediateIds[randomInt(0, intermediateIds.length - 1)];
    const rest = intermediateIds.filter((id) => id !== first);
    const second = rest[randomInt(0, rest.length - 1)];
    addEdge(first, second);
    addEdge(second, first);
  }

  const candidatePairs: Array<[string, string]> = [];
  for (const from of ['s', ...intermediateIds]) {
    for (const to of [...intermediateIds, 't']) {
      if (from !== to && from !== 't' && to !== 's') {
        candidatePairs.push([from, to]);
      }
    }
  }

  while (edgePairs.size < edgeTargetCount && candidatePairs.length > 0) {
    const idx = randomInt(0, candidatePairs.length - 1);
    const [from, to] = candidatePairs[idx];
    addEdge(from, to);
    candidatePairs.splice(idx, 1);
  }

  if (![...edgePairs].some((pair) => pair.startsWith('s->'))) {
    addEdge('s', intermediateIds[0]);
  }
  if (![...edgePairs].some((pair) => pair.endsWith('->t'))) {
    addEdge(intermediateIds[0], 't');
  }

  let edgeId = 1;
  const edges = [...edgePairs].map((pair) => {
    const [source, target] = pair.split('->');
    const capacity = randomInt(capacityRange[0], capacityRange[1]);
    return {
      data: {
        id: `e${edgeId++}`,
        source,
        target,
        capacity,
        flow: 0,
        label: `0/${capacity}`,
      },
    };
  });

  return {
    name: complexity === 'simple' ? 'Simple Flow Network' : 'Complex Flow Network',
    nodes,
    edges,
    directed: true,
    source: 's',
    sink: 't',
  };
}

export function AlgorithmVisualizer() {
  const [appState, setAppState] = useState<AppState>('editing');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('ford-fulkerson');
  const [selectedComplexity, setSelectedComplexity] = useState<GraphComplexity>('simple');
  const [selectedShortestPath, setSelectedShortestPath] = useState<ShortestPathChoice>('dijkstra');
  const [selectedSourceNode, setSelectedSourceNode] = useState('s');
  const [showResidual, setShowResidual] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [algorithmSteps, setAlgorithmSteps] = useState<Array<MaxFlowAlgorithmStep | ShortestPathAlgorithmStep>>([]);
  const [currentGraph, setCurrentGraph] = useState<FlowNetworkGraph>(() => generateGraphByComplexity('simple'));

  const cyRef = useRef<cytoscape.Core | null>(null);
  const currentStepData = algorithmSteps[currentStep];

  const toShortestPathGraph = (graph: FlowNetworkGraph): ShortestPathGraph => {
    const bellmanFordWeights = buildBellmanFordWeightMap(graph);

    return {
      name: graph.name,
      nodes: graph.nodes.map((node, index) => ({
        ...node,
        data: {
          ...node.data,
          label: labelForIndex(index),
        },
        classes: undefined,
      })),
      edges: graph.edges.map((edge) => ({
        ...edge,
        classes: undefined,
        data: {
          ...edge.data,
          weight: selectedShortestPath === 'bellman-ford'
            ? (bellmanFordWeights.get(edge.data.id) ?? edge.data.capacity ?? 1)
            : (edge.data.capacity ?? 1),
          label: selectedShortestPath === 'bellman-ford'
            ? `${bellmanFordWeights.get(edge.data.id) ?? edge.data.capacity ?? 1}`
            : `${edge.data.capacity ?? 1}`,
        },
      })),
      directed: true,
      source: selectedSourceNode,
    };
  };

  const shortestPathGraph = toShortestPathGraph(currentGraph);
  const sourceNodeOptions = shortestPathGraph.nodes.map((node) => ({
    id: node.data.id,
    label: node.data.label,
  }));

  useEffect(() => {
    const sourceIds = sourceNodeOptions.map((node) => node.id);
    if (!sourceIds.includes(selectedSourceNode)) {
      setSelectedSourceNode(sourceIds[0] ?? 's');
    }
  }, [selectedSourceNode, sourceNodeOptions]);

  const resetExecutionState = useCallback(() => {
    setAppState('editing');
    setCurrentStep(0);
    setIsPlaying(false);
    setShowResidual(false);
    setAlgorithmSteps([]);
  }, []);

  const editingElements = selectedAlgorithm === 'ford-fulkerson'
    ? currentGraph.nodes.concat(currentGraph.edges)
    : shortestPathGraph.nodes.concat(shortestPathGraph.edges);
  const normalGraphElements: GraphElement[] =
    appState === 'running' || appState === 'finished'
      ? currentStepData?.elements ?? []
      : editingElements;
  const currentResidualElements =
    currentStepData && 'residualElements' in currentStepData
      ? currentStepData.residualElements
      : undefined;
  const residualGraphElements: GraphElement[] =
    appState === 'running' || appState === 'finished'
      ? currentStep === 0
        ? []
        : currentResidualElements ?? []
      : [];

  const handleRun = () => {
    const steps = selectedAlgorithm === 'ford-fulkerson'
      ? emitFordFulkersonSteps(currentGraph)
      : selectedShortestPath === 'bellman-ford'
        ? emitBellmanFordSteps(shortestPathGraph, selectedSourceNode)
        : emitDijkstraSteps(shortestPathGraph, selectedSourceNode);
    setAlgorithmSteps(steps);
    setAppState('running');
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleComplexityChange = (value: string) => {
    if (selectedAlgorithm === 'ford-fulkerson') {
      setSelectedComplexity(value === 'complex' ? 'complex' : 'simple');
    } else {
      setSelectedShortestPath(value === 'dijkstra' ? 'dijkstra' : 'bellman-ford');
    }
    resetExecutionState();
  };

  const handleGenerateGraph = () => {
    const next = generateGraphByComplexity('simple', {
      preferCycles: selectedAlgorithm === 'shortest-paths' && selectedShortestPath === 'bellman-ford',
    });
    setCurrentGraph(next);
    setSelectedSourceNode(next.source);
    resetExecutionState();
  };

  const handleNext = useCallback(() => {
    if (currentStep < algorithmSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setAppState('finished');
      setIsPlaying(false);
    }
  }, [currentStep, algorithmSteps.length]);

  const handleFinish = useCallback(() => {
    setAppState('finished');
    setIsPlaying(false);
  }, []);

  usePlayback({
    isPlaying,
    appState,
    currentStep,
    stepCount: algorithmSteps.length,
    playbackSpeed: playbackSpeed[0],
    onAdvance: handleNext,
    onFinish: handleFinish,
  });

  return (
    <div className="h-full bg-background flex flex-col overflow-hidden">
      <HeaderBar
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={(value) => {
          setSelectedAlgorithm(value);
          if (value === 'ford-fulkerson') {
            const next = generateGraphByComplexity(selectedComplexity);
            setCurrentGraph(next);
            setSelectedSourceNode(next.source);
          }
          resetExecutionState();
        }}
        selectedComplexity={selectedAlgorithm === 'ford-fulkerson' ? selectedComplexity : selectedShortestPath}
        onComplexityChange={handleComplexityChange}
        selectedSourceNode={selectedSourceNode}
        sourceNodeOptions={sourceNodeOptions}
        onSourceNodeChange={setSelectedSourceNode}
        onGenerateGraph={handleGenerateGraph}
        onRun={handleRun}
        onReset={resetExecutionState}
        runDisabled={appState === 'running' || appState === 'finished'}
      />

      <ThreePanelLayout
        center={
          <GraphCanvasPanel
            appState={appState}
            selectedAlgorithm={selectedAlgorithm}
            selectedShortestPath={selectedShortestPath}
            normalElements={normalGraphElements}
            residualElements={residualGraphElements}
            showResidual={showResidual}
            onShowResidualChange={setShowResidual}
            onReady={(cy) => {
              cyRef.current = cy;
            }}
            onZoomIn={() => cyRef.current?.zoom(cyRef.current.zoom() * 1.2)}
            onZoomOut={() => cyRef.current?.zoom(cyRef.current.zoom() * 0.8)}
            onFit={() => cyRef.current?.fit(undefined, 30)}
          />
        }
        right={
          <StepInspectorPanel
            appState={appState}
            currentStepData={currentStepData}
            totalSteps={algorithmSteps.length}
            selectedAlgorithm={selectedAlgorithm}
          />
        }
      />

      <PlaybackControls
        appState={appState}
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={algorithmSteps.length}
        onStart={handleRun}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
        onPrevious={() => {
          if (currentStep > 0) setCurrentStep((prev) => prev - 1);
        }}
        onPlayPause={() => setIsPlaying((prev) => !prev)}
        onNext={handleNext}
        onStepChange={setCurrentStep}
      />
    </div>
  );
}
