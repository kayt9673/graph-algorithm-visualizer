import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { AppState } from '../../core/graph/types';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Slider } from '../../app/components/ui/slider';

interface PlaybackControlsProps {
  appState: AppState;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  onStart: () => void;
  playbackSpeed: number[];
  onPlaybackSpeedChange: (value: number[]) => void;
  onPrevious: () => void;
  onPlayPause: () => void;
  onNext: () => void;
  onStepChange: (step: number) => void;
}

export function PlaybackControls({
  appState,
  isPlaying,
  currentStep,
  totalSteps,
  onStart,
  playbackSpeed,
  onPlaybackSpeedChange,
  onPrevious,
  onPlayPause,
  onNext,
  onStepChange,
}: PlaybackControlsProps) {
  const active = appState === 'running' || appState === 'finished';
  const maxStep = Math.max(0, totalSteps - 1);
  const shownStep = active ? currentStep + 1 : 0;

  const handlePlayClick = () => {
    if (!active) {
      onStart();
      return;
    }
    onPlayPause();
  };

  const handleStepChange = (value: number[]) => {
    if (!active) {
      onStart();
      return;
    }
    onStepChange(value[0]);
  };

  return (
    <div className="border-t border-border bg-card min-h-[88px]">
      <div className="px-4 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <Button size="icon" variant="outline" onClick={onPrevious} disabled={!active || currentStep === 0}><SkipBack className="h-4 w-4" /></Button>
            <Button size="icon" onClick={handlePlayClick} disabled={active && appState === 'finished' && currentStep === totalSteps - 1}>
              {active && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button size="icon" variant="outline" onClick={onNext} disabled={!active || currentStep === totalSteps - 1}><SkipForward className="h-4 w-4" /></Button>
          </div>

          <div className="flex-1 flex items-center gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">{shownStep} / {Math.max(1, totalSteps)}</span>
            <Slider
              value={[Math.min(currentStep, maxStep)]}
              onValueChange={handleStepChange}
              onPointerDown={!active ? onStart : undefined}
              max={maxStep}
              step={1}
              className="flex-1"
            />
          </div>

          <div className="flex items-center justify-between lg:justify-start gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
              <Label htmlFor="speed" className="text-sm whitespace-nowrap">Speed</Label>
              <div className="w-[100px] lg:w-[120px]"><Slider id="speed" value={playbackSpeed} onValueChange={onPlaybackSpeedChange} min={0.5} max={2} step={0.5} /></div>
              <span className="text-sm text-muted-foreground w-8">{playbackSpeed[0]}x</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
