import { useRef, useEffect } from "react";
import type { WebviewMessageUnion } from "../shared/types/messages-barrel";

// Mappa globale agent/event -> subscriber
const bus: Map<string, Set<(msg: WebviewMessageUnion) => void>> = new Map();

/**
 * Sottoscrive un agente MAS a determinati eventi tipizzati, cleanup auto con React
 * @param event tipo dell'evento/azione
 * @param callback callback ricezione messaggi
 */
export function useAgentBus<T extends WebviewMessageUnion>(
  event: T["type"],
  callback: (msg: T) => void
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // Wrapper per mantenere il type-safe
    const handler = (msg: WebviewMessageUnion) => {
      if (msg.type === event) {
        callbackRef.current(msg as T);
      }
    };
    if (!bus.has(event)) {
      bus.set(event, new Set());
    }
    bus.get(event)?.add(handler);
    return () => {
      bus.get(event)?.delete(handler);
      // Pulizia bus vuoto opzionale
      if (bus.has(event) && bus.get(event)?.size === 0) {
        bus.delete(event);
      }
    };
  }, [event]);
}

/**
 * Dispatcher centralizzato MAS agent/pubsub type-safe
 */
export function dispatchMASMessage<T extends WebviewMessageUnion>(msg: T) {
  const listeners = bus.get(msg.type);
  if (listeners) {
    listeners.forEach(fn => fn(msg));
  }
}