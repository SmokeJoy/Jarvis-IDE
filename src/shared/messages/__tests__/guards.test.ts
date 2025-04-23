import { describe, it, expect } from 'vitest';
import { isExtensionMessage } from '../guards/isExtensionMessage';

// Messaggio valido
const validMessage = {
  type: 'promptProfiles',
  payload: { profiles: [] }
};

// Messaggio non valido
const invalidMessage = {
  foo: 'bar'
};

describe('isExtensionMessage', () => {
  it('should return true for a valid extension message', () => {
    expect(isExtensionMessage(validMessage)).toBe(true);
  });

  it('should return false for an invalid message', () => {
    expect(isExtensionMessage(invalidMessage)).toBe(false);
  });
}); 