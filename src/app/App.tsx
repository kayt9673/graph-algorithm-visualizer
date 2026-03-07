import { useCallback, useRef, useState } from 'react';
import type cytoscape from 'cytoscape';
import { HeaderBar } from './layout/HeaderBar';
import { ThreePanelLayout } from './layout/ThreePanelLayout';
import { GraphCanvasPanel } from '../features/graph-canvas/GraphCanvasPanel';
import { StepInspectorPanel } from '../features/step-inspector/StepInspectorPanel';
import { PlaybackControls } from '../features/playback/PlaybackControls';
import { usePlayback } from '../features/playback/usePlayback';
import { emitFordFulkersonSteps } from '../core/algorithms/maxflow/stepEmitter';
import type { MaxFlowAlgorithmStep } from '../core/steps/types';
import type { AppState, FlowNetworkGraph, GraphElement } from '../core/graph/types';

type GraphComplexity = 'simple' | 'complex';

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
    { data: { id: 's', label: 'S' }, classes: 'source' },
    ...nodeIds.map((id) => ({ data: { id, label: id.toUpperCase() } })),
    { data: { id: 't', label: 'T' }, classes: 'sink' },
  ];
}

function generateGraphByComplexity(complexity: GraphComplexity): FlowNetworkGraph {
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
    const key = `${source}->${target}`;
    edgePairs.add(key);
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
      if (Math.random() < (complexity === 'simple' ? 0.2 : 0.3)) {
        addEdge(intermediateIds[i], intermediateIds[j]);
      }
      if (Math.random() < (complexity === 'simple' ? 0.05 : 0.12)) {
        addEdge(intermediateIds[j], intermediateIds[i]);
      }
    }
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

export default function App() {
  const [appState, setAppState] = useState<AppState>('editing');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('ford-fulkerson');
  const [selectedComplexity, setSelectedComplexity] = useState<GraphComplexity>('simple');
  const [showResidual, setShowResidual] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [algorithmSteps, setAlgorithmSteps] = useState<MaxFlowAlgorithmStep[]>([]);
  const [currentGraph, setCurrentGraph] = useState<FlowNetworkGraph>(() => generateGraphByComplexity('simple'));

  const cyRef = useRef<cytoscape.Core | null>(null);
  const currentStepData = algorithmSteps[currentStep];

  const resetExecutionState = useCallback(() => {
    setAppState('editing');
    setCurrentStep(0);
    setIsPlaying(false);
    setShowResidual(false);
    setAlgorithmSteps([]);
  }, []);

  const editingElements = currentGraph.nodes.concat(currentGraph.edges);
  const normalGraphElements: GraphElement[] =
    appState === 'running' || appState === 'finished'
      ? currentStepData?.elements ?? []
      : editingElements;
  const residualGraphElements: GraphElement[] =
    appState === 'running' || appState === 'finished'
      ? currentStepData?.residualElements ?? []
      : [];

  const handleCyReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;
  };

  const handleRun = () => {
    const steps = emitFordFulkersonSteps(currentGraph);
    setAlgorithmSteps(steps);
    setAppState('running');
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleComplexityChange = (value: string) => {
    const next: GraphComplexity = value === 'complex' ? 'complex' : 'simple';
    setSelectedComplexity(next);
    setCurrentGraph(generateGraphByComplexity(next));
    resetExecutionState();
  };

  const handleGenerateGraph = () => {
    setCurrentGraph(generateGraphByComplexity(selectedComplexity));
    resetExecutionState();
  };

  const handleReset = () => {
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

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <HeaderBar
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={setSelectedAlgorithm}
        selectedComplexity={selectedComplexity}
        onComplexityChange={handleComplexityChange}
        onGenerateGraph={handleGenerateGraph}
        onRun={handleRun}
        onReset={handleReset}
        runDisabled={appState === 'running' || appState === 'finished'}
      />

      <ThreePanelLayout
        center={
          <GraphCanvasPanel
            appState={appState}
            normalElements={normalGraphElements}
            residualElements={residualGraphElements}
            showResidual={showResidual}
            onShowResidualChange={setShowResidual}
            onReady={handleCyReady}
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
          />
        }
      />

      <PlaybackControls
        appState={appState}
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={algorithmSteps.length}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
        onPrevious={handlePrevious}
        onPlayPause={() => setIsPlaying((prev) => !prev)}
        onNext={handleNext}
        onStepChange={setCurrentStep}
      />
    </div>
  );
}
