import { motion } from 'framer-motion';
import { AuditEntry } from '../types/audit';
import { useAutoMitigation } from '../contexts/AutoMitigationContext';
import { useProviderBlacklist } from '../hooks/useProviderBlacklist';
import { Tooltip } from '@radix-ui/react-tooltip';

interface TimelineEntryProps {
  entry: AuditEntry;
  isSelected: boolean;
  onSelect: () => void;
}

export const TimelineEntry: React.FC<TimelineEntryProps> = ({ entry, isSelected, onSelect }) => {
  const { isActive, confidence } = useAutoMitigation();
  const { isBlocked, getBlockReason } = useProviderBlacklist();
  
  const hasAutoMitigation = entry.type === 'provider_change' && isActive;
  const isProviderBlocked = entry.type === 'provider_change' && isBlocked(entry.selectedProvider);
  const blockReason = isProviderBlocked ? getBlockReason(entry.selectedProvider) : null;

  const getBadges = () => {
    const badges = [];

    if (hasAutoMitigation) {
      badges.push(
        <span
          key="auto-mitigation"
          className="px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100"
          title={`Auto-Mitigation con confidenza: ${(confidence * 100).toFixed(1)}%`}
        >
          🛡️ Auto-Mitigation
        </span>
      );
    }

    if (isProviderBlocked) {
      badges.push(
        <Tooltip.Root key="blocked">
          <Tooltip.Trigger asChild>
            <span className="px-2 py-1 text-xs rounded-full bg-red-800 text-red-100 cursor-help">
              🚫 Bloccato
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content 
            className="bg-gray-900 text-white p-2 rounded shadow-lg max-w-xs"
            side="top"
          >
            <div className="text-sm font-medium">Provider Bloccato</div>
            <div className="text-xs text-gray-300 mt-1">
              {blockReason || "Provider bloccato tramite auto-mitigation"}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Ultimo aggiornamento: {new Date().toLocaleTimeString()}
            </div>
          </Tooltip.Content>
        </Tooltip.Root>
      );
    }

    if (entry.type === 'predictive') {
      badges.push(
        <span
          key="predictive"
          className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100"
        >
          🔮 Predictive
        </span>
      );
    }

    if (entry.type === 'replay') {
      badges.push(
        <span
          key="replay"
          className="px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-100"
        >
          ♻️ Replay
        </span>
      );
    }

    return badges;
  };

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
        </div>
        <div className="flex flex-col items-end gap-1">
          {getBadges()}
        </div>
      </div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
        {entry.details}
      </div>
    </motion.div>
  );
}; 