import { useContext } from 'react';
import type { ExtensionStateContextType } from '../context/types.js.js';
import type { ExtensionStateContext } from '../context/ExtensionStateContext.js.js';

export const useJarvisIdeContext = (): ExtensionStateContextType => {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error('useJarvisIdeContext must be used within an ExtensionStateProvider');
  }
  return context;
};