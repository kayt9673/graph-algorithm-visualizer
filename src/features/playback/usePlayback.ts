import { useEffect } from 'react';
import type { AppState } from '../../core/graph/types';

interface UsePlaybackArgs {
  isPlaying: boolean;
  appState: AppState;
  currentStep: number;
  stepCount: number;
  playbackSpeed: number;
  onAdvance: () => void;
  onFinish: () => void;
}

export function usePlayback({
  isPlaying,
  appState,
  currentStep,
  stepCount,
  playbackSpeed,
  onAdvance,
  onFinish,
}: UsePlaybackArgs) {
  useEffect(() => {
    if (!isPlaying || (appState !== 'running' && appState !== 'finished')) return;

    const interval = setInterval(() => {
      if (currentStep < stepCount - 1) {
        onAdvance();
      } else {
        onFinish();
      }
    }, 2000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, appState, currentStep, stepCount, playbackSpeed, onAdvance, onFinish]);
}
