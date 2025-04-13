import { LLMEventBus, LLMEventType } from '../../src/mas/core/fallback/LLMEventBus';

export function assertEventEmitted(bus: LLMEventBus, eventType: LLMEventType): void {
  expect((bus.emit as jest.Mock).mock.calls.some(call => call[0] === eventType)).toBe(true);
}

export function assertEventNotEmitted(bus: LLMEventBus, eventType: LLMEventType): void {
  expect((bus.emit as jest.Mock).mock.calls.some(call => call[0] === eventType)).toBe(false);
}

export function getEventPayload(bus: LLMEventBus, eventType: LLMEventType): any {
  const call = (bus.emit as jest.Mock).mock.calls.find(call => call[0] === eventType);
  return call ? call[1] : null;
} 