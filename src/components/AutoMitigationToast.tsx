import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAutoMitigation } from '../hooks/useAutoMitigation';

export const AutoMitigationToast: React.FC = () => {
  const { isActive, currentProvider, nextProvider, confidence } = useAutoMitigation();

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">🛡️</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Auto-Mitigation Attiva
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Switching da {currentProvider} a {nextProvider}
              </p>
              <div className="mt-1">
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <motion.div
                    className="bg-blue-600 h-1.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${confidence * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Confidenza: {(confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 