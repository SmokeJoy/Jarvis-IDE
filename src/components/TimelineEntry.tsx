import { motion } from 'framer-motion';
import { AuditEntry } from '../types/audit';

interface TimelineEntryProps {
  entry: AuditEntry;
  isSelected: boolean;
  onClick: () => void;
}

export const TimelineEntry = ({ entry, isSelected, onClick }: TimelineEntryProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected 
          ? 'bg-indigo-900/50 border border-indigo-500' 
          : 'bg-gray-800 hover:bg-gray-700'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="text-sm text-gray-400">
            {new Date(entry.timestamp).toLocaleTimeString()}
          </div>
          <div className="text-white font-medium">
            {entry.strategyName}
          </div>
          <div className="text-sm text-gray-300">
            {entry.selectedProvider}
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          {entry.__replayed && (
            <div className="flex items-center gap-1 text-xs text-indigo-400">
              <span>♻️</span>
              <span>Replay</span>
            </div>
          )}
          {entry.__predicted && (
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <span>🔮</span>
              <span>Predictive</span>
            </div>
          )}
        </div>
      </div>

      {entry.fallbackReason && (
        <div className="mt-2 text-sm text-red-400">
          {entry.fallbackReason}
        </div>
      )}
    </motion.div>
  );
}; 