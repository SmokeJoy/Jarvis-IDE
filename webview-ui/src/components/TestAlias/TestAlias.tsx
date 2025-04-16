import React from 'react';
import { useExtensionState } from '@/context/ExtensionStateContext';

const TestAlias: React.FC = () => {
  const { state } = useExtensionState();

  return (
    <div>
      <h2>Test Alias Import</h2>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  );
};

export default TestAlias; 