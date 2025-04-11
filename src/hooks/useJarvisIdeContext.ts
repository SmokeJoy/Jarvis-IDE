import { useContext } from 'react';
import { ExtensionStateContextType } from '../context/types.js';
import { ExtensionStateContext } from '../context/ExtensionStateContext.js';

export const useJarvisIdeContext = (): ExtensionStateContextType => {
  const context = useContext(ExtensionStateContext);
  if (!context) {
    throw new Error('useJarvisIdeContext must be used within an ExtensionStateProvider');
  }
  return context;
};