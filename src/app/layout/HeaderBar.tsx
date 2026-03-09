import { Play, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

interface HeaderBarProps {
  selectedAlgorithm: string;
  onAlgorithmChange: (value: string) => void;
  selectedComplexity: string;
  onComplexityChange: (value: string) => void;
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
  selectedSourceNode,
  sourceNodeOptions,
  onSourceNodeChange,
  onGenerateGraph,
  onRun,
  onReset,
  runDisabled,
}: HeaderBarProps) {
  const isFordFulkerson = selectedAlgorithm === 'ford-fulkerson';

  return (
    <header className="border-b border-border bg-card">
      <div className="px-4 lg:px-8 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-8 w-full lg:w-auto">
          <h1 className="text-lg lg:text-xl tracking-tight whitespace-nowrap">Graph Algorithm Visualizer</h1>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="algorithm" className="text-sm whitespace-nowrap">Algorithm</Label>
              <Select value={selectedAlgorithm} onValueChange={onAlgorithmChange}>
                <SelectTrigger id="algorithm" className="w-full sm:w-[220px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ford-fulkerson">Ford-Fulkerson (Max Flow)</SelectItem>
                  <SelectItem value="shortest-paths">Shortest Paths</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Label htmlFor="complexity" className="text-sm whitespace-nowrap">
                {isFordFulkerson ? 'Complexity' : 'Shortest Path'}
              </Label>
              <Select value={selectedComplexity} onValueChange={onComplexityChange}>
                <SelectTrigger id="complexity" className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {isFordFulkerson ? (
                    <>
                      <SelectItem value="simple">Simple</SelectItem>
                      <SelectItem value="complex">Complex</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="bellman-ford" disabled>Bellman-Ford</SelectItem>
                      <SelectItem value="dijkstra">Dijkstra's</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {!isFordFulkerson && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label htmlFor="source-node" className="text-sm whitespace-nowrap">Source</Label>
                <Select value={selectedSourceNode} onValueChange={onSourceNodeChange}>
                  <SelectTrigger id="source-node" className="w-full sm:w-[120px]"><SelectValue /></SelectTrigger>
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

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Button onClick={onGenerateGraph} variant="outline" className="gap-2 flex-1 lg:flex-initial">
            <RefreshCw className="h-4 w-4" />
            Generate New Graph
          </Button>
          <Button onClick={onRun} disabled={runDisabled} className="gap-2 flex-1 lg:flex-initial"><Play className="h-4 w-4" />Run</Button>
          <Button onClick={onReset} variant="outline" className="gap-2 flex-1 lg:flex-initial"><RotateCcw className="h-4 w-4" />Reset</Button>
        </div>
      </div>
    </header>
  );
}
