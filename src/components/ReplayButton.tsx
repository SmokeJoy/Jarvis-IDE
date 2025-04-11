import { motion } from 'framer-motion';
import { PlayIcon } from '@heroicons/react/24/solid';
import { AuditEntry } from '../types/audit';
import { replaySnapshot } from '../lib/replaySnapshot';

interface ReplayButtonProps {
  entry: AuditEntry;
  onReplayStart?: () => void;
  onReplayComplete?: (success: boolean) => void;
}

export const ReplayButton = ({ 
  entry, 
  onReplayStart,
  onReplayComplete 
}: ReplayButtonProps) => {
  const handleReplay = async () => {
    onReplayStart?.();
    
    const success = await replaySnapshot(entry);
    
    onReplayComplete?.(success);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleReplay}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors"
    >
      <PlayIcon className="h-5 w-5" />
      <span>Replay Decisione</span>
    </motion.button>
  );
}; 