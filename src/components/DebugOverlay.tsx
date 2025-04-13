import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { MitigatorOverlay } from './MitigatorOverlay';
import { DebuggerTimeline } from './DebuggerTimeline';
import { SnapshotDetail } from './SnapshotDetail';
import { useDebuggerOverlay } from '../hooks/useDebuggerOverlay';
import { LLMEventBus } from '../lib/eventBus';

interface DebugOverlayProps {
  eventBus: LLMEventBus;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({ eventBus }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<number | null>(null);
  const { current, history } = useDebuggerOverlay(eventBus);

  // Toggle visibility with keyboard shortcut (Ctrl+Shift+D)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectEntry = (entry: any) => {
    const index = history.findIndex((h) => h.timestamp === entry.timestamp);
    setSelectedEntry(index);
  };

  const handleCloseSnapshot = () => {
    setSelectedEntry(null);
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <>
            {history.length > 0 && (
              <DebuggerTimeline
                history={history}
                onSelect={handleSelectEntry}
                selectedIndex={selectedEntry}
              />
            )}
            {current && <MitigatorOverlay {...current} onClose={() => setIsVisible(false)} />}
            {selectedEntry !== null && history[selectedEntry] && (
              <SnapshotDetail data={history[selectedEntry]} onClose={handleCloseSnapshot} />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  );
};
