import type { ReactNode } from 'react';

interface ThreePanelLayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}

export function ThreePanelLayout({ left, center, right }: ThreePanelLayoutProps) {
  return <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">{left}{center}{right}</div>;
}
