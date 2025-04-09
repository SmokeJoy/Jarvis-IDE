export function useKeyboardShortcut(keyArray: string[]): boolean {
  const modifierMap: { [key: string]: boolean } = {
    'Control': false,
    'Shift': false,
    'Alt': false,
    'Meta': false
  }

  if (keyArray[0] && Object.keys(modifierMap).includes(keyArray[0])) {
    // ... existing code ...
  }

  return false
} 