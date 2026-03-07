import type { ReactNode } from 'react';

interface ThreePanelLayoutProps {
  center: ReactNode;
  right: ReactNode;
}

export function ThreePanelLayout({ center, right }: ThreePanelLayoutProps) {
  return <div className="flex-1 flex overflow-hidden flex-col lg:flex-row">{center}{right}</div>;
}
