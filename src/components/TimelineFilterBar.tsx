import React from 'react';
import { EventType, ProviderFilter } from '../hooks/useFilteredHistory';

interface TimelineFilterBarProps {
  eventType: EventType;
  provider: ProviderFilter;
  strategy: string;
  availableProviders: string[];
  availableStrategies: string[];
  onEventTypeChange: (type: EventType) => void;
  onProviderChange: (provider: ProviderFilter) => void;
  onStrategyChange: (strategy: string) => void;
}

export const TimelineFilterBar: React.FC<TimelineFilterBarProps> = ({
  eventType,
  provider,
  strategy,
  availableProviders,
  availableStrategies,
  onEventTypeChange,
  onProviderChange,
  onStrategyChange
}) => {
  return (
    <div className="bg-gray-800 p-2 rounded-lg mb-2">
      <div className="flex space-x-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Event Type</label>
          <select
            value={eventType}
            onChange={(e) => onEventTypeChange(e.target.value as EventType)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            <option value="all">All Events</option>
            <option value="provider:failure">Provider Failures</option>
            <option value="strategy:adaptive:change">Strategy Changes</option>
            <option value="provider:success">Provider Success</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => onProviderChange(e.target.value as ProviderFilter)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            <option value="all">All Providers</option>
            {availableProviders.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1">Strategy</label>
          <select
            value={strategy}
            onChange={(e) => onStrategyChange(e.target.value)}
            className="w-full bg-gray-700 text-white rounded px-2 py-1 text-sm"
          >
            <option value="all">All Strategies</option>
            {availableStrategies.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}; 