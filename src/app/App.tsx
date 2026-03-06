import { useCallback, useRef, useState } from 'react';
import type cytoscape from 'cytoscape';
import { HeaderBar } from './layout/HeaderBar';
import { ThreePanelLayout } from './layout/ThreePanelLayout';
import { GraphEditorPanel } from '../features/graph-editor/GraphEditorPanel';
import { GraphCanvasPanel } from '../features/graph-canvas/GraphCanvasPanel';
import { StepInspectorPanel } from '../features/step-inspector/StepInspectorPanel';
import { PlaybackControls } from '../features/playback/PlaybackControls';
import { usePlayback } from '../features/playback/usePlayback';
import { mockAlgorithmSteps } from '../core/algorithms/maxflow/stepEmitter';
import { exampleGraphs } from '../data/examples/exampleGraphs';
import type { AppState, GraphElement } from '../core/graph/types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('editing');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('ford-fulkerson');
  const [selectedExample, setSelectedExample] = useState('simple');
  const [isDirected, setIsDirected] = useState(true);
  const [showResidual, setShowResidual] = useState(false);
  const [showEdgeLabels, setShowEdgeLabels] = useState(true);
  const [showNodeIds, setShowNodeIds] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState([1]);
  const [autoPlay, setAutoPlay] = useState(false);

  const cyRef = useRef<cytoscape.Core | null>(null);

  const currentGraph = exampleGraphs[selectedExample] ?? exampleGraphs.simple;
  const currentStepData = mockAlgorithmSteps[currentStep];

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
    setAppState('running');
    setCurrentStep(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setAppState('editing');
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleNext = useCallback(() => {
    if (currentStep < mockAlgorithmSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setAppState('finished');
      setIsPlaying(false);
    }
  }, [currentStep]);

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
    stepCount: mockAlgorithmSteps.length,
    playbackSpeed: playbackSpeed[0],
    onAdvance: handleNext,
    onFinish: handleFinish,
  });

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <HeaderBar
        selectedAlgorithm={selectedAlgorithm}
        onAlgorithmChange={setSelectedAlgorithm}
        selectedExample={selectedExample}
        onExampleChange={setSelectedExample}
        onRun={handleRun}
        onReset={handleReset}
        runDisabled={appState === 'running' || appState === 'finished'}
      />

      <ThreePanelLayout
        left={<GraphEditorPanel isDirected={isDirected} onDirectedChange={setIsDirected} currentGraph={currentGraph} />}
        center={
          <GraphCanvasPanel
            appState={appState}
            normalElements={normalGraphElements}
            residualElements={residualGraphElements}
            showResidual={showResidual}
            onShowResidualChange={setShowResidual}
            showEdgeLabels={showEdgeLabels}
            onShowEdgeLabelsChange={setShowEdgeLabels}
            showNodeIds={showNodeIds}
            onShowNodeIdsChange={setShowNodeIds}
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
            totalSteps={mockAlgorithmSteps.length}
          />
        }
      />

      <PlaybackControls
        appState={appState}
        isPlaying={isPlaying}
        currentStep={currentStep}
        totalSteps={mockAlgorithmSteps.length}
        playbackSpeed={playbackSpeed}
        onPlaybackSpeedChange={setPlaybackSpeed}
        autoPlay={autoPlay}
        onAutoPlayChange={setAutoPlay}
        onPrevious={handlePrevious}
        onPlayPause={() => setIsPlaying((prev) => !prev)}
        onNext={handleNext}
        onStepChange={setCurrentStep}
      />
    </div>
  );
}
