import { LLMEventPayload, LLMEventType } from '../../src/shared/types/llm-event.types';

/** Options for configuring the MockEventBus behavior */
interface MockEventBusOptions {
  /** Whether to store emitted events for later inspection */
  spyOnEmittedEvents?: boolean;
  /** Whether to automatically add timestamps to event payloads */
  addTimestampToPayload?: boolean;
}

/** 
 * Represents an event that has been emitted through the bus
 * @template T - The specific event type
 */
type EmittedEvent<T extends LLMEventType = LLMEventType> = {
  /** The type of event that was emitted */
  type: T;
  /** The payload associated with the event */
  payload: LLMEventPayload<T>;
};

/**
 * A mock implementation of the event bus for testing purposes.
 * Allows tracking emitted events and simulating event bus behavior.
 */
export class MockEventBus {
  /** Configuration options for the mock event bus */
  private readonly options: MockEventBusOptions;
  /** Internal storage for emitted events when spying is enabled */
  private readonly emittedEvents: EmittedEvent[] = [];

  /**
   * Creates a new instance of MockEventBus
   * @param options - Configuration options for the mock event bus
   */
  constructor(options: MockEventBusOptions = {}) {
    this.options = options;
  }

  /**
   * Emits an event through the mock bus
   * @param type - The type of event to emit
   * @param payload - The event payload
   * @returns void
   */
  emit<T extends LLMEventType>(type: T, payload: LLMEventPayload<T>): void {
    if (this.options.addTimestampToPayload) {
      payload.timestamp = Date.now();
    }

    if (this.options.spyOnEmittedEvents) {
      this.emittedEvents.push({ type, payload });
    }
  }

  /**
   * Returns all events that have been emitted through this bus
   * @returns Readonly array of emitted events
   */
  getEmittedEvents(): ReadonlyArray<EmittedEvent> {
    return [...this.emittedEvents];
  }

  /**
   * Clears the history of emitted events
   * @returns void
   */
  clearEmittedEvents(): void {
    this.emittedEvents.length = 0;
  }
}
// ... existing code ...