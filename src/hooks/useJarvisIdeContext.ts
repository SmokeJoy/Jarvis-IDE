import { useContext } from 'react';
import type { ExtensionStateContextType } from '../context/types.js';
import type { ExtensionStateContext } from '../context/ExtensionStateContext.js';

export const useJarvisIdeContext = (): ExtensionStateContextType => {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error('useJarvisIdeContext must be used within an ExtensionStateProvider');
  }
  return context;
};