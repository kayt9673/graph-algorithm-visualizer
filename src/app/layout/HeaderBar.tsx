import { Play, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface HeaderBarProps {
  selectedAlgorithm: string;
  onAlgorithmChange: (value: string) => void;
  selectedComplexity: string;
  onComplexityChange: (value: string) => void;
  selectedMSTAlgorithm: string;
  onMSTAlgorithmChange: (value: string) => void;
  selectedSourceNode: string;
  sourceNodeOptions: Array<{ id: string; label: string }>;
  onSourceNodeChange: (value: string) => void;
  onGenerateGraph: () => void;
  onRun: () => void;
  onReset: () => void;
  runDisabled: boolean;
}

export function HeaderBar({
  selectedAlgorithm,
  onAlgorithmChange,
  selectedComplexity,
  onComplexityChange,
  selectedMSTAlgorithm,
  onMSTAlgorithmChange,
  selectedSourceNode,
  sourceNodeOptions,
  onSourceNodeChange,
  onGenerateGraph,
  onRun,
  onReset,
  runDisabled,
}: HeaderBarProps) {
  const isFordFulkerson = selectedAlgorithm === 'ford-fulkerson';
  const isMST = selectedAlgorithm === 'mst';

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 lg:px-6 py-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 xl:gap-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-5 w-full xl:w-auto xl:min-w-0">
          <h1 className="text-lg lg:text-xl tracking-tight whitespace-nowrap xl:mr-2">Graph Algorithm Visualizer</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto xl:flex-nowrap">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="algorithm" className="text-sm whitespace-nowrap">Algorithm</Label>
              <Select value={selectedAlgorithm} onValueChange={onAlgorithmChange}>
                <SelectTrigger id="algorithm" className="w-full sm:w-[220px] xl:w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ford-fulkerson">Ford-Fulkerson (Max Flow)</SelectItem>
                  <SelectItem value="shortest-paths">Shortest Paths</SelectItem>
                  <SelectItem value="mst">Minimum Spanning Tree</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!isMST && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="complexity" className="text-sm whitespace-nowrap">
                {isFordFulkerson ? 'Complexity' : 'Shortest Path'}
              </Label>
              <Select value={selectedComplexity} onValueChange={onComplexityChange}>
                <SelectTrigger id="complexity" className="w-full sm:w-[180px] xl:w-[160px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isFordFulkerson ? (
                    <>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="bellman-ford">Bellman-Ford</SelectItem>
                      <SelectItem value="dijkstra">Dijkstra's</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              </div>
            )}

            {isMST && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="mst-algorithm" className="text-sm whitespace-nowrap">MST</Label>
                <Select value={selectedMSTAlgorithm} onValueChange={onMSTAlgorithmChange}>
                  <SelectTrigger id="mst-algorithm" className="w-full sm:w-[170px] xl:w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kruskal">Kruskal</SelectItem>
                    <SelectItem value="prim">Prim</SelectItem>
                    <SelectItem value="reverse-delete">Reverse-Delete</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {((!isFordFulkerson && !isMST) || (isMST && selectedMSTAlgorithm === 'prim')) && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="source-node" className="text-sm whitespace-nowrap">Source</Label>
                <Select value={selectedSourceNode} onValueChange={onSourceNodeChange}>
                  <SelectTrigger id="source-node" className="w-full sm:w-[72px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sourceNodeOptions.map((node) => (
                      <SelectItem key={node.id} value={node.id}>{node.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full xl:w-auto xl:flex-shrink-0">
          <Button onClick={onGenerateGraph} variant="outline" className="gap-2 flex-1 xl:flex-initial whitespace-nowrap">
            <RefreshCw className="h-4 w-4" />
            Generate Graph
          </Button>
          <Button onClick={onRun} disabled={runDisabled} className="gap-2 flex-1 xl:flex-initial whitespace-nowrap"><Play className="h-4 w-4" />Run</Button>
          <Button onClick={onReset} variant="outline" className="gap-2 flex-1 xl:flex-initial whitespace-nowrap"><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
    </header>
  );
}
