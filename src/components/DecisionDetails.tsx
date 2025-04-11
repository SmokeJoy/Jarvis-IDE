import { motion } from 'framer-motion';
import { XIcon } from '@heroicons/react/24/outline';
import { AuditEntry } from '../types/audit';
import { ReplayButton } from './ReplayButton';

interface DecisionDetailsProps {
  entry: AuditEntry;
  onClose: () => void;
}

export const DecisionDetails = ({ entry, onClose }: DecisionDetailsProps) => {
  const handleReplayStart = () => {
    console.log('Inizio replay della decisione:', entry.timestamp);
  };

  const handleReplayComplete = (success: boolean) => {
    console.log('Replay completato:', success ? 'successo' : 'fallito');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="p-4"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Dettagli Decisione
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white"
        >
          <XIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Header con pulsante replay */}
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-400">
              {new Date(entry.timestamp).toLocaleString()}
            </div>
            <div className="text-lg font-medium text-white">
              {entry.strategyName}
            </div>
          </div>
          <ReplayButton
            entry={entry}
            onReplayStart={handleReplayStart}
            onReplayComplete={handleReplayComplete}
          />
        </div>

        {/* Fallback reason */}
        {entry.fallbackReason && (
          <div className="bg-red-900/50 rounded-lg p-3">
            <div className="text-sm text-red-400 font-medium">
              Motivo Fallback
            </div>
            <div className="text-sm text-red-300 mt-1">
              {entry.fallbackReason}
            </div>
          </div>
        )}

        {/* Provider selezionato */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 font-medium">
            Provider Selezionato
          </div>
          <div className="text-sm text-white mt-1">
            {entry.selectedProvider}
          </div>
        </div>

        {/* Provider candidates */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 font-medium mb-2">
            Provider Candidates
          </div>
          <div className="space-y-2">
            {entry.providerCandidates.map((provider) => (
              <div
                key={provider.id}
                className={`flex justify-between items-center p-2 rounded ${
                  provider.excluded ? 'bg-red-900/20' : 'bg-green-900/20'
                }`}
              >
                <span className="text-sm text-white">{provider.id}</span>
                {provider.score && (
                  <span className="text-sm text-gray-400">
                    score: {provider.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Active conditions */}
        <div className="bg-gray-800 rounded-lg p-3">
          <div className="text-sm text-gray-400 font-medium mb-2">
            Condizioni Attive
          </div>
          <div className="space-y-1">
            {entry.activeConditions.map((condition, index) => (
              <div
                key={index}
                className="flex items-center text-sm"
              >
                <span className={`mr-2 ${condition.isActive ? 'text-green-400' : 'text-red-400'}`}>
                  {condition.isActive ? '✓' : '✗'}
                </span>
                <span className="text-white">{condition.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}; 