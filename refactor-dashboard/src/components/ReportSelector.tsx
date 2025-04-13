import React from 'react';

interface ReportSelectorProps {
  reports: string[];
  selectedReport: string | null;
  onSelectReport: (reportName: string) => void;
}

const ReportSelector: React.FC<ReportSelectorProps> = ({ reports, selectedReport, onSelectReport }) => {
  if (reports.length === 0) {
    return <p className="text-center text-gray-500">Nessun report disponibile.</p>;
  }

  return (
    <div className="mb-6">
      <label htmlFor="report-select" className="block text-sm font-medium text-gray-700 mb-1">
        Seleziona Report:
      </label>
      <select
        id="report-select"
        value={selectedReport || ''}
        onChange={(e) => onSelectReport(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
      >
        <option value="" disabled>-- Scegli un report --</option>
        {reports.map((reportName) => (
          <option key={reportName} value={reportName}>
            {reportName}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ReportSelector; 