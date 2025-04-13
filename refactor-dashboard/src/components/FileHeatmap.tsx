import React from 'react';

interface SafetyIssue {
  file: string;
}

interface FileHeatmapProps {
  data: SafetyIssue[];
}

const FileHeatmap: React.FC<FileHeatmapProps> = ({ data }) => {
  // Aggrega i dati per file
  const issuesByFile = data.reduce((acc, issue) => {
    acc[issue.file] = (acc[issue.file] || 0) + 1;
    return acc;
  }, {} as { [key: string]: number });

  // Ordina i file per numero di issue (dal più alto al più basso) e prendi i primi 10
  const sortedFiles = Object.entries(issuesByFile)
    .sort(([, countA], [, countB]) => countB - countA)
    .slice(0, 10);

  if (sortedFiles.length === 0) {
    return <p className="text-center text-gray-500">Nessun dato da visualizzare.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File
            </th>
            <th scope="col" className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Numero Problemi
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedFiles.map(([file, count]) => (
            <tr key={file}>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-800" title={file}>
                {/* Mostra solo la parte finale del path per leggibilità */}
                ...{file.split('/').pop() || file.split('\\').pop() || file}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-sm text-red-600 text-right font-medium">
                {count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FileHeatmap; 