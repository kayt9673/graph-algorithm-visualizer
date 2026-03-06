import { Plus } from 'lucide-react';
import { Button } from '../../app/components/ui/button';
import { Input } from '../../app/components/ui/input';
import { Label } from '../../app/components/ui/label';
import { ScrollArea } from '../../app/components/ui/scroll-area';
import { Separator } from '../../app/components/ui/separator';
import { Switch } from '../../app/components/ui/switch';
import type { GraphModel } from '../../core/graph/types';

interface GraphEditorPanelProps {
  isDirected: boolean;
  onDirectedChange: (value: boolean) => void;
  currentGraph: GraphModel;
}

export function GraphEditorPanel({ isDirected, onDirectedChange, currentGraph }: GraphEditorPanelProps) {
  return (
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
                <Switch id="directed" checked={isDirected} onCheckedChange={onDirectedChange} />
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

              <Button className="w-full" variant="secondary">Validate Graph</Button>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
