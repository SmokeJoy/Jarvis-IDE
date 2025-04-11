import { motion } from 'framer-motion';
import { AuditEntry } from '../types/audit';
import { useAutoMitigation } from '../contexts/AutoMitigationContext';

interface TimelineEntryProps {
  entry: AuditEntry;
  isSelected: boolean;
  onSelect: () => void;
}

export const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry, isSelected, onSelect }) => {
  const { isActive, confidence } = useAutoMitigation();
  const hasAutoMitigation = entry.type === 'provider_change' && isActive;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">{entry.timestamp.toLocaleTimeString()}</span>
          {hasAutoMitigation && (
            <span
              className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100"
              title={`Auto-Mitigation con confidenza: ${(confidence * 100).toFixed(1)}%`}
            >
              🛡️ Auto-Mitigation
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">{entry.type}</span>
      </div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {entry.details}
      </div>
    </motion.div>
  );
}; 