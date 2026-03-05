import { Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import type { AppState } from '../../core/graph/types';
import { Button } from '../../app/components/ui/button';
import { Label } from '../../app/components/ui/label';
import { Slider } from '../../app/components/ui/slider';
import { Switch } from '../../app/components/ui/switch';

interface PlaybackControlsProps {
  appState: AppState;
  isPlaying: boolean;
  currentStep: number;
  totalSteps: number;
  playbackSpeed: number[];
  onPlaybackSpeedChange: (value: number[]) => void;
  autoPlay: boolean;
  onAutoPlayChange: (value: boolean) => void;
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
  playbackSpeed,
  onPlaybackSpeedChange,
  autoPlay,
  onAutoPlayChange,
  onPrevious,
  onPlayPause,
  onNext,
  onStepChange,
}: PlaybackControlsProps) {
  const active = appState === 'running' || appState === 'finished';

  return (
    <div className="border-t border-border bg-card min-h-[88px]">
      {active ? (
        <div className="px-4 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 justify-center lg:justify-start">
              <Button size="icon" variant="outline" onClick={onPrevious} disabled={currentStep === 0}><SkipBack className="h-4 w-4" /></Button>
              <Button size="icon" onClick={onPlayPause} disabled={appState === 'finished' && currentStep === totalSteps - 1}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="outline" onClick={onNext} disabled={currentStep === totalSteps - 1}><SkipForward className="h-4 w-4" /></Button>
            </div>

            <div className="flex-1 flex items-center gap-4">
              <span className="text-sm text-muted-foreground whitespace-nowrap">{currentStep + 1} / {totalSteps}</span>
              <Slider value={[currentStep]} onValueChange={(value) => onStepChange(value[0])} max={totalSteps - 1} step={1} className="flex-1" />
            </div>

            <div className="flex items-center justify-between lg:justify-start gap-4 lg:gap-6">
              <div className="flex items-center gap-3">
                <Label htmlFor="speed" className="text-sm whitespace-nowrap">Speed</Label>
                <div className="w-[100px] lg:w-[120px]"><Slider id="speed" value={playbackSpeed} onValueChange={onPlaybackSpeedChange} min={0.5} max={2} step={0.5} /></div>
                <span className="text-sm text-muted-foreground w-8">{playbackSpeed[0]}x</span>
              </div>

              <div className="flex items-center gap-2">
                <Switch id="autoplay" checked={autoPlay} onCheckedChange={onAutoPlayChange} />
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
  );
}
