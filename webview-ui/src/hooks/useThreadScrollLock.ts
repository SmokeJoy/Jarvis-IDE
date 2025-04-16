import { useCallback, useRef, useState } from "react";

interface UseThreadScrollLock {
  lockEnabled: boolean;
  activateLock: () => void;
  deactivateLock: () => void;
  scrollToThread: (threadId: string) => void;
}

export function useThreadScrollLock(debounceMs: number = 100): UseThreadScrollLock {
  const [lockEnabled, setLockEnabled] = useState(true);
  const lastScrollThread = useRef<string | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const activateLock = useCallback(() => setLockEnabled(true), []);
  const deactivateLock = useCallback(() => setLockEnabled(false), []);

  const scrollToThread = useCallback((threadId: string) => {
    if (!lockEnabled) return;
    // debounce per evitare scroll multipli ravvicinati
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    debounceTimeout.current = setTimeout(() => {
      // Cerca nella pagina il thread DOM element corrispondente e scrolla
      const elem = document.querySelector(`[data-threadid=\"${threadId}\"]`);
      if (elem && typeof elem.scrollIntoView === "function") {
        elem.scrollIntoView({ behavior: "smooth", block: "center" });
        lastScrollThread.current = threadId;
      }
    }, debounceMs);
  }, [lockEnabled, debounceMs]);

  return {
    lockEnabled,
    activateLock,
    deactivateLock,
    scrollToThread
  };
}