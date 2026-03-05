import { useState, useRef, useEffect } from 'react';
import { CytoscapeGraph } from './components/CytoscapeGraph';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Plus,
  ChevronDown,
  Info,
  Settings
} from 'lucide-react';
import { Button } from './components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Switch } from './components/ui/switch';
import { Slider } from './components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Separator } from './components/ui/separator';
import { ScrollArea } from './components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './components/ui/collapsible';
import type cytoscape from 'cytoscape';

type AppState = 'empty' | 'editing' | 'running' | 'finished';

interface GraphNode {
  data: { id: string; label: string };
  classes?: string;
}

interface GraphEdge {
  data: { id: string; source: string; target: string; capacity?: number; flow?: number; label?: string };
  classes?: string;
}

interface AlgorithmStep {
  id: number;
  title: string;
  description: string;
  currentFlow?: number;
  bottleneck?: number;
  path?: string[];
  totalMaxFlow?: number;
  elements: (GraphNode | GraphEdge)[];
}

// Example graph data
const exampleGraphs = {
  'simple': {
    name: 'Simple Flow Network',
    nodes: [
      { data: { id: 's', label: 'S' }, classes: 'source' },
      { data: { id: 'a', label: 'A' } },
      { data: { id: 'b', label: 'B' } },
      { data: { id: 't', label: 'T' }, classes: 'sink' },
    ],
    edges: [
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 0, label: '0/10' } },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 0, label: '0/10' } },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ],
    source: 's',
    sink: 't',
  },
  'complex': {
    name: 'Complex Flow Network',
    nodes: [
      { data: { id: 's', label: 'S' }, classes: 'source' },
      { data: { id: 'a', label: 'A' } },
      { data: { id: 'b', label: 'B' } },
      { data: { id: 'c', label: 'C' } },
      { data: { id: 'd', label: 'D' } },
      { data: { id: 't', label: 'T' }, classes: 'sink' },
    ],
    edges: [
      { data: { id: 'e1', source: 's', target: 'a', capacity: 16, flow: 0, label: '0/16' } },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 13, flow: 0, label: '0/13' } },
      { data: { id: 'e3', source: 'a', target: 'c', capacity: 12, flow: 0, label: '0/12' } },
      { data: { id: 'e4', source: 'b', target: 'a', capacity: 4, flow: 0, label: '0/4' } },
      { data: { id: 'e5', source: 'b', target: 'd', capacity: 14, flow: 0, label: '0/14' } },
      { data: { id: 'e6', source: 'c', target: 'b', capacity: 9, flow: 0, label: '0/9' } },
      { data: { id: 'e7', source: 'c', target: 't', capacity: 20, flow: 0, label: '0/20' } },
      { data: { id: 'e8', source: 'd', target: 'c', capacity: 7, flow: 0, label: '0/7' } },
      { data: { id: 'e9', source: 'd', target: 't', capacity: 4, flow: 0, label: '0/4' } },
    ],
    source: 's',
    sink: 't',
  },
};

// Mock algorithm steps
const mockAlgorithmSteps: AlgorithmStep[] = [
  {
    id: 0,
    title: 'Initial State',
    description: 'Starting Ford-Fulkerson algorithm. All edges have zero flow. We will find augmenting paths from source S to sink T.',
    currentFlow: 0,
    totalMaxFlow: 0,
    elements: exampleGraphs.simple.nodes.concat(exampleGraphs.simple.edges as any),
  },
  {
    id: 1,
    title: 'Found Augmenting Path',
    description: 'Found path S → A → T with bottleneck capacity 10. This is the minimum capacity along the path.',
    currentFlow: 0,
    bottleneck: 10,
    path: ['s', 'a', 't'],
    totalMaxFlow: 0,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 0, label: '0/10' }, classes: 'augmenting' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 0, label: '0/10' }, classes: 'augmenting' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ] as any,
  },
  {
    id: 2,
    title: 'Augment Flow',
    description: 'Increased flow by 10 units along path S → A → T. Edges are now saturated.',
    currentFlow: 10,
    path: ['s', 'a', 't'],
    totalMaxFlow: 10,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' } },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' } },
    ] as any,
  },
  {
    id: 3,
    title: 'Found Another Path',
    description: 'Found path S → B → T with bottleneck capacity 5.',
    currentFlow: 10,
    bottleneck: 5,
    path: ['s', 'b', 't'],
    totalMaxFlow: 10,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 0, label: '0/5' }, classes: 'augmenting' },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 0, label: '0/5' }, classes: 'augmenting' },
    ] as any,
  },
  {
    id: 4,
    title: 'Maximum Flow Achieved',
    description: 'No more augmenting paths exist. The maximum flow from S to T is 15 units.',
    currentFlow: 15,
    totalMaxFlow: 15,
    elements: [
      ...exampleGraphs.simple.nodes,
      { data: { id: 'e1', source: 's', target: 'a', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e2', source: 's', target: 'b', capacity: 5, flow: 5, label: '5/5' }, classes: 'saturated' },
      { data: { id: 'e3', source: 'a', target: 't', capacity: 10, flow: 10, label: '10/10' }, classes: 'saturated' },
      { data: { id: 'e4', source: 'b', target: 't', capacity: 5, flow: 5, label: '5/5' }, classes: 'saturated' },
    ] as any,
  },
];

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
  const [stateJsonOpen, setStateJsonOpen] = useState(false);
  
  const cyRef = useRef<cytoscape.Core | null>(null);

  const currentGraph = exampleGraphs[selectedExample as keyof typeof exampleGraphs];
  const graphElements = appState === 'running' || appState === 'finished' 
    ? mockAlgorithmSteps[currentStep]?.elements || []
    : currentGraph.nodes.concat(currentGraph.edges as any);

  const handleCyReady = (cy: cytoscape.Core) => {
    cyRef.current = cy;
  };

  const handleZoomIn = () => {
    cyRef.current?.zoom(cyRef.current.zoom() * 1.2);
  };

  const handleZoomOut = () => {
    cyRef.current?.zoom(cyRef.current.zoom() * 0.8);
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 30);
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

  const handleNext = () => {
    if (currentStep < mockAlgorithmSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setAppState('finished');
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && (appState === 'running' || appState === 'finished')) {
      const interval = setInterval(() => {
        if (currentStep < mockAlgorithmSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setAppState('finished');
          setIsPlaying(false);
        }
      }, 2000 / playbackSpeed[0]);

      return () => clearInterval(interval);
    }
  }, [isPlaying, currentStep, appState, playbackSpeed]);

  const currentStepData = mockAlgorithmSteps[currentStep];

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="px-4 lg:px-8 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 w-full lg:w-auto">
            <h1 className="text-lg lg:text-xl tracking-tight whitespace-nowrap">Graph Algorithm Visualizer</h1>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="algorithm" className="text-sm whitespace-nowrap">Algorithm</Label>
                <Select value={selectedAlgorithm} onValueChange={setSelectedAlgorithm}>
                  <SelectTrigger id="algorithm" className="w-full sm:w-[220px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ford-fulkerson">Ford-Fulkerson (Max Flow)</SelectItem>
                    <SelectItem value="dijkstra" disabled>Dijkstra (Coming Soon)</SelectItem>
                    <SelectItem value="bellman-ford" disabled>Bellman-Ford (Coming Soon)</SelectItem>
                    <SelectItem value="prim" disabled>Prim (Coming Soon)</SelectItem>
                    <SelectItem value="kruskal" disabled>Kruskal (Coming Soon)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="example" className="text-sm whitespace-nowrap">Example</Label>
                <Select value={selectedExample} onValueChange={setSelectedExample}>
                  <SelectTrigger id="example" className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simple">Simple Flow Network</SelectItem>
                    <SelectItem value="complex">Complex Flow Network</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <Button 
              onClick={handleRun} 
              disabled={appState === 'running' || appState === 'finished'}
              className="gap-2 flex-1 lg:flex-initial"
            >
              <Play className="h-4 w-4" />
              Run
            </Button>
            <Button 
              onClick={handleReset} 
              variant="outline"
              className="gap-2 flex-1 lg:flex-initial"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Left Panel - Graph Input */}
        <div className="w-full lg:w-[280px] border-b lg:border-b-0 lg:border-r border-border bg-card overflow-auto">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="mb-4">Graph Input</h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="add-node" className="text-sm mb-2 block">Add Node</Label>
                    <div className="flex gap-2">
                      <Input id="add-node" placeholder="Node ID" className="flex-1" />
                      <Button size="icon" variant="outline">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm mb-2 block">Add Edge</Label>
                    <div className="space-y-2">
                      <Input placeholder="From" />
                      <Input placeholder="To" />
                      <Input placeholder="Capacity/Weight" type="number" />
                      <Button className="w-full" variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Edge
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <Label htmlFor="directed" className="text-sm">Directed Graph</Label>
                    <Switch 
                      id="directed" 
                      checked={isDirected} 
                      onCheckedChange={setIsDirected} 
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-sm mb-2 block">Max Flow Parameters</Label>
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor="source" className="text-xs text-muted-foreground">Source Node</Label>
                        <Input id="source" placeholder="s" value={currentGraph.source} readOnly />
                      </div>
                      <div>
                        <Label htmlFor="sink" className="text-xs text-muted-foreground">Sink Node</Label>
                        <Input id="sink" placeholder="t" value={currentGraph.sink} readOnly />
                      </div>
                    </div>
                  </div>

                  <Button className="w-full" variant="secondary">
                    Validate Graph
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Center Panel - Graph Canvas */}
        <div className="flex-1 flex flex-col bg-muted/20">
          {/* Canvas Controls */}
          <div className="border-b border-border bg-card px-4 lg:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" onClick={handleFit}>
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Switch 
                  id="residual" 
                  checked={showResidual} 
                  onCheckedChange={setShowResidual}
                />
                <Label htmlFor="residual" className="text-sm cursor-pointer whitespace-nowrap">Show Residual Graph</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="edge-labels" 
                  checked={showEdgeLabels} 
                  onCheckedChange={setShowEdgeLabels}
                />
                <Label htmlFor="edge-labels" className="text-sm cursor-pointer whitespace-nowrap">Show Edge Labels</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="node-ids" 
                  checked={showNodeIds} 
                  onCheckedChange={setShowNodeIds}
                />
                <Label htmlFor="node-ids" className="text-sm cursor-pointer whitespace-nowrap">Show Node IDs</Label>
              </div>
            </div>
          </div>

          {/* Cytoscape Canvas */}
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
                <CytoscapeGraph 
                  elements={graphElements} 
                  onReady={handleCyReady}
                />
              )}
            </div>
          </div>

          {/* Legend */}
          <div className="border-t border-border bg-card px-4 lg:px-6 py-3">
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-sm">
              <span className="font-medium">Legend:</span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#2563eb]" />
                <span className="text-xs">Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#16a34a]" />
                <span className="text-xs">Augmenting Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#dc2626]" />
                <span className="text-xs">Saturated</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-[#9ca3af]" />
                <span className="text-xs">Residual</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-[#f59e0b]" />
                <span className="text-xs">Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Step Inspector */}
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
                        <Badge variant="outline">Step {currentStepData.id + 1} of {mockAlgorithmSteps.length}</Badge>
                        {appState === 'finished' && (
                          <Badge className="bg-[#16a34a] text-white">Complete</Badge>
                        )}
                      </div>
                      <h4 className="mb-2">{currentStepData.title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {currentStepData.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Current Step Flow</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-medium">
                            {currentStepData.currentFlow ?? 0} units
                          </div>
                        </CardContent>
                      </Card>

                                            <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Bottleneck</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-medium min-h-[2rem]">
                            {currentStepData.bottleneck !== undefined ? `${currentStepData.bottleneck} units` : '-'}
                          </div>
                        </CardContent>
                      </Card>

                                            <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Augmenting Path</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-base font-medium font-mono min-h-[1.5rem]">
                            {currentStepData.path ? currentStepData.path.join(' -> ') : 'No path in this step'}
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-primary text-primary-foreground">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Total Max Flow</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-medium">
                            {currentStepData.totalMaxFlow ?? 0} units
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Separator />

                    <Collapsible open={stateJsonOpen} onOpenChange={setStateJsonOpen}>
                      <CollapsibleTrigger className="flex items-center justify-between w-full">
                        <span className="text-sm font-medium">State JSON</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${stateJsonOpen ? 'rotate-180' : ''}`} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-3">
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-[200px] font-mono">
                          {JSON.stringify({
                            step: currentStepData.id,
                            flow: currentStepData.currentFlow,
                            maxFlow: currentStepData.totalMaxFlow,
                            path: currentStepData.path,
                          }, null, 2)}
                        </pre>
                      </CollapsibleContent>
                    </Collapsible>
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
      </div>

      {/* Bottom Playback Bar */}
      <div className="border-t border-border bg-card min-h-[88px]">
        {(appState === 'running' || appState === 'finished') ? (
          <div className="px-4 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
              {/* Playback Controls */}
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon"
                  onClick={handlePlayPause}
                  disabled={appState === 'finished' && currentStep === mockAlgorithmSteps.length - 1}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button 
                  size="icon" 
                  variant="outline"
                  onClick={handleNext}
                  disabled={currentStep === mockAlgorithmSteps.length - 1}
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>

              {/* Progress Scrubber */}
              <div className="flex-1 flex items-center gap-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {currentStep + 1} / {mockAlgorithmSteps.length}
                </span>
                <Slider
                  value={[currentStep]}
                  onValueChange={(value) => setCurrentStep(value[0])}
                  max={mockAlgorithmSteps.length - 1}
                  step={1}
                  className="flex-1"
                />
              </div>

              {/* Speed Control and Auto-play */}
              <div className="flex items-center justify-between lg:justify-start gap-4 lg:gap-6">
                <div className="flex items-center gap-3">
                  <Label htmlFor="speed" className="text-sm whitespace-nowrap">Speed</Label>
                  <div className="w-[100px] lg:w-[120px]">
                    <Slider
                      id="speed"
                      value={playbackSpeed}
                      onValueChange={setPlaybackSpeed}
                      min={0.5}
                      max={2}
                      step={0.5}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{playbackSpeed[0]}x</span>
                </div>

                {/* Auto-play Toggle */}
                <div className="flex items-center gap-2">
                  <Switch 
                    id="autoplay" 
                    checked={autoPlay} 
                    onCheckedChange={setAutoPlay}
                  />
                  <Label htmlFor="autoplay" className="text-sm cursor-pointer">Auto-play</Label>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full px-4 lg:px-8 py-4 flex items-center text-sm text-muted-foreground">
            Run the algorithm to enable step playback controls.
          </div>
        )}
      </div>
    </div>
  );
}

