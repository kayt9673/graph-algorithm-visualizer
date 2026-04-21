import { useState } from 'react';
import { Button } from './components/ui/button';
import { AlgorithmVisualizer } from './AlgorithmVisualizer';
import { BasicBayesNetView } from '../features/bayes-net/BasicBayesNetView';

export default function App() {
  const [view, setView] = useState<'algorithms' | 'bayes-net'>('algorithms');

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="border-b border-border bg-card px-4 py-3 lg:px-8">
        <div className="flex items-center gap-2">
          <Button
            variant={view === 'algorithms' ? 'default' : 'outline'}
            onClick={() => setView('algorithms')}
          >
            Algorithms
          </Button>
          <Button
            variant={view === 'bayes-net' ? 'default' : 'outline'}
            onClick={() => setView('bayes-net')}
          >
            Bayes Net
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {view === 'algorithms' ? <AlgorithmVisualizer /> : <BasicBayesNetView />}
      </div>
    </div>
  );
}
