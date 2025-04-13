import { useState, useEffect } from 'react';
import ReportSelector from './components/ReportSelector';
import TrendChart from './components/TrendChart';
import ErrorPie from './components/ErrorPie';
import FileHeatmap from './components/FileHeatmap';

// Definisci l'interfaccia per i dati del report
interface SafetyIssue {
  type: string;
  file: string;
  line: number;
  code?: string;
  message: string;
}

interface SafetyReport {
  timestamp: string;
  totalFiles: number;
  filesWithIssues: number;
  issues: SafetyIssue[];
}

function App() {
  const [availableReports, setAvailableReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [reportData, setReportData] = useState<SafetyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Carica la lista dei report disponibili all'avvio
  useEffect(() => {
    async function fetchReports() {
      try {
        // Simula il fetch dei nomi file dalla directory public/reports
        // In una build reale, questi file sarebbero statici.
        // Qui usiamo una chiamata fetch per simulare la scoperta.
        const response = await fetch('./reports/'); // Assumendo che il server serva l'elenco
        if (!response.ok) {
          // Fallback: Prova a leggere un report di default se l'elenco non è disponibile
          console.warn('Elenco report non trovato, provo a caricare report di default...');
          // Cerca un file che inizi con safety-report e finisca con .json
          // Questo è un workaround per ambienti di sviluppo statici
          // In produzione, potresti avere un endpoint API o generare una lista statica
          const potentialReports = [
             'safety-report-latest.json' // Esempio di nome file
             // Aggiungi altri nomi comuni se necessario
          ];
          setAvailableReports(potentialReports);
          if(potentialReports.length > 0) setSelectedReport(potentialReports[0]);
          return;
        }
        const files = await response.json(); // Assumi un array di stringhe
        setAvailableReports(files.filter((f: string) => f.startsWith('safety-report-') && f.endsWith('.json')));
        if (files.length > 0) {
          setSelectedReport(files[0]);
        }
      } catch (e) {
        setError('Errore nel caricare la lista dei report. Assicurati che i report siano in public/reports/');
        console.error(e);
        // Fallback se il fetch fallisce (es. server statico senza directory listing)
         const potentialReports = [
             'safety-report-latest.json'
          ];
         setAvailableReports(potentialReports);
         if(potentialReports.length > 0) setSelectedReport(potentialReports[0]);
      }
    }
    fetchReports();
  }, []);

  // Carica i dati del report selezionato
  useEffect(() => {
    if (!selectedReport) return;

    async function loadReportData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`./reports/${selectedReport}`);
        if (!response.ok) {
          throw new Error(`Impossibile caricare il report: ${response.statusText}`);
        }
        const data: SafetyReport = await response.json();
        setReportData(data);
      } catch (e) {
        setError(`Errore caricando ${selectedReport}: ${e.message}`);
        setReportData(null);
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadReportData();
  }, [selectedReport]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Dashboard Sicurezza Messaggi</h1>
      
      <ReportSelector 
        reports={availableReports}
        selectedReport={selectedReport}
        onSelectReport={setSelectedReport}
      />

      {loading && <p className="text-center text-blue-600 mt-4">Caricamento report...</p>}
      {error && <p className="text-center text-red-600 mt-4">{error}</p>}

      {reportData && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Sezione Riepilogo */}
          <div className="bg-white p-4 rounded-lg shadow col-span-1 lg:col-span-3 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">File Totali</p>
              <p className="text-2xl font-semibold">{reportData.totalFiles}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">File con Problemi</p>
              <p className="text-2xl font-semibold text-red-600">{reportData.filesWithIssues}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Problemi Totali</p>
              <p className="text-2xl font-semibold text-red-600">{reportData.issues.length}</p>
            </div>
          </div>

          {/* Grafico Errori per Tipo */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Problemi per Tipo</h2>
            {reportData.issues.length > 0 ? (
              <ErrorPie data={reportData.issues} />
            ) : (
              <p className="text-center text-gray-500">Nessun problema rilevato!</p>
            )}
          </div>

          {/* Grafico Trend (da implementare con più report) */}
           <div className="bg-white p-4 rounded-lg shadow">
             <h2 className="text-xl font-semibold mb-4">Trend Problemi (Placeholder)</h2>
             {/* <TrendChart data={historicalData} /> */}
             <p className="text-center text-gray-400 italic">Grafico trend richiede storico report</p>
           </div>

          {/* Tabella File più Problematici */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">File più Problematici</h2>
             {reportData.issues.length > 0 ? (
               <FileHeatmap data={reportData.issues} />
             ) : (
               <p className="text-center text-gray-500">Nessun problema rilevato!</p>
             )}
          </div>
        </div>
      )}

      {!reportData && !loading && !error && (
         <p className="text-center text-gray-500 mt-10">Seleziona un report per visualizzare i dati.</p>
      )}
    </div>
  );
}

export default App; 