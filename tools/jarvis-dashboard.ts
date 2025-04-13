/**
 * @file jarvis-dashboard.ts
 * @description Dashboard per il monitoraggio del refactoring della type safety in Jarvis IDE
 * 
 * Uso:
 * npx ts-node --esm tools/jarvis-dashboard.ts         # Visualizza dashboard in CLI
 * npx ts-node --esm tools/jarvis-dashboard.ts --html  # Genera dashboard HTML
 * npx ts-node --esm tools/jarvis-dashboard.ts --trend # Aggiorna trend storico
 * 
 * @author TypescriptGPT & Team Jarvis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as url from 'url';
import * as yaml from 'js-yaml';
import * as os from 'os';

// Get current file directory for ES modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const REPORT_FILE = path.resolve(process.cwd(), 'refactor-map.yaml');
const TREND_FILE = path.resolve(process.cwd(), 'refactor-trend.md');
const HTML_OUTPUT = path.resolve(process.cwd(), 'out', 'refactor-dashboard.html');

// Interfacce
interface FileReport {
  path: string;
  anyCount: number;
  jsImports: number;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'in-progress' | 'completed';
}

interface RefactorMap {
  lastUpdated: string;
  totalAnyCount: number;
  totalJsImports: number;
  files: FileReport[];
}

interface TrendData {
  date: string;
  anyCount: number;
  jsImports: number;
}

// ANSI color codes per output colorato
const Colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Carica il file di report YAML
 */
function loadReport(): RefactorMap {
  try {
    const fileContent = fs.readFileSync(REPORT_FILE, 'utf8');
    return yaml.load(fileContent) as RefactorMap;
  } catch (error) {
    console.error(`${Colors.red}Errore nel caricamento del report:${Colors.reset}`, error);
    process.exit(1);
  }
}

/**
 * Estrae i dati storici dal file di trend
 */
function loadTrendData(): TrendData[] {
  if (!fs.existsSync(TREND_FILE)) {
    return [];
  }

  const fileContent = fs.readFileSync(TREND_FILE, 'utf8');
  const trendData: TrendData[] = [];
  
  // Formato: # data: anyCount jsImports
  const trendRegex = /(\d{4}-\d{2}-\d{2}): (\d+) any types, (\d+) js imports/g;
  let match;
  
  while ((match = trendRegex.exec(fileContent)) !== null) {
    trendData.push({
      date: match[1],
      anyCount: parseInt(match[2], 10),
      jsImports: parseInt(match[3], 10)
    });
  }
  
  return trendData;
}

/**
 * Aggiorna il file di trend con i dati correnti
 */
function updateTrendFile(report: RefactorMap): void {
  const date = new Date().toISOString().split('T')[0];
  const entry = `${date}: ${report.totalAnyCount} any types, ${report.totalJsImports} js imports\n`;
  
  if (fs.existsSync(TREND_FILE)) {
    fs.appendFileSync(TREND_FILE, entry);
  } else {
    fs.writeFileSync(TREND_FILE, `# Refactoring Trend\n\n${entry}`);
  }
  
  console.log(`${Colors.green}File di trend aggiornato: ${TREND_FILE}${Colors.reset}`);
}

/**
 * Genera un grafico ASCII semplice per il trend
 */
function generateAsciiChart(trendData: TrendData[]): string {
  if (trendData.length === 0) {
    return 'Nessun dato disponibile per il grafico';
  }
  
  const maxAny = Math.max(...trendData.map(d => d.anyCount));
  const maxJs = Math.max(...trendData.map(d => d.jsImports));
  const maxValue = Math.max(maxAny, maxJs);
  const height = 10;
  const width = trendData.length;
  
  let chart = '\n';
  chart += `${Colors.yellow}${maxValue}${Colors.reset} ┌${'─'.repeat(width * 2)}┐\n`;
  
  // Genera le linee del grafico
  for (let h = 0; h < height; h++) {
    const level = maxValue - (h * maxValue / height);
    chart += `${Colors.yellow}${level.toFixed(0).padStart(4)}${Colors.reset} │`;
    
    for (let w = 0; w < width; w++) {
      const anyLevel = (trendData[w].anyCount / maxValue) * height;
      const jsLevel = (trendData[w].jsImports / maxValue) * height;
      
      if (height - h <= anyLevel && height - h <= jsLevel) {
        chart += `${Colors.red}* ${Colors.reset}`;
      } else if (height - h <= anyLevel) {
        chart += `${Colors.yellow}A ${Colors.reset}`;
      } else if (height - h <= jsLevel) {
        chart += `${Colors.cyan}J ${Colors.reset}`;
      } else {
        chart += '  ';
      }
    }
    chart += '│\n';
  }
  
  chart += `${Colors.yellow}   0${Colors.reset} └${'─'.repeat(width * 2)}┘\n`;
  chart += `     ${trendData.map((_, i) => (i % 2 === 0 ? i : ' ')).join(' ')}\n\n`;
  chart += `     ${Colors.yellow}A${Colors.reset} = any types, ${Colors.cyan}J${Colors.reset} = js imports, ${Colors.red}*${Colors.reset} = both\n`;
  
  return chart;
}

/**
 * Calcola le statistiche dal report
 */
function calculateStats(report: RefactorMap) {
  const totalFiles = report.files.length;
  const filesWithAny = report.files.filter(f => f.anyCount > 0).length;
  const filesWithJs = report.files.filter(f => f.jsImports > 0).length;
  const completedFiles = report.files.filter(f => f.status === 'completed').length;
  const inProgressFiles = report.files.filter(f => f.status === 'in-progress').length;
  const pendingFiles = report.files.filter(f => f.status === 'pending').length;
  
  const highPriorityFiles = report.files.filter(f => f.priority === 'high').length;
  const mediumPriorityFiles = report.files.filter(f => f.priority === 'medium').length;
  const lowPriorityFiles = report.files.filter(f => f.priority === 'low').length;
  
  return {
    totalFiles,
    filesWithAny,
    filesWithJs,
    completedFiles,
    inProgressFiles,
    pendingFiles,
    highPriorityFiles,
    mediumPriorityFiles,
    lowPriorityFiles,
    totalAnyCount: report.totalAnyCount,
    totalJsImports: report.totalJsImports
  };
}

/**
 * Mostra la dashboard in modalità CLI
 */
function displayCliDashboard(report: RefactorMap, trendData: TrendData[]): void {
  const stats = calculateStats(report);
  const lastUpdated = new Date(report.lastUpdated).toLocaleString();
  
  // Titolo
  console.log(`\n${Colors.bgBlue}${Colors.white}${Colors.bright} JARVIS REFACTOR DASHBOARD ${Colors.reset}\n`);
  console.log(`${Colors.dim}Ultimo aggiornamento: ${lastUpdated}${Colors.reset}\n`);
  
  // Stats principali
  console.log(`${Colors.bright}${Colors.yellow}📊 STATISTICHE GENERALI${Colors.reset}`);
  console.log(`${Colors.cyan}File analizzati:${Colors.reset} ${stats.totalFiles}`);
  console.log(`${Colors.cyan}File con 'any':${Colors.reset} ${stats.filesWithAny} (${(stats.filesWithAny / stats.totalFiles * 100).toFixed(1)}%)`);
  console.log(`${Colors.cyan}File con '.js' imports:${Colors.reset} ${stats.filesWithJs} (${(stats.filesWithJs / stats.totalFiles * 100).toFixed(1)}%)`);
  console.log(`${Colors.cyan}Totale 'any' trovati:${Colors.reset} ${stats.totalAnyCount}`);
  console.log(`${Colors.cyan}Totale '.js' imports:${Colors.reset} ${stats.totalJsImports}`);
  
  // Stato progresso
  console.log(`\n${Colors.bright}${Colors.yellow}🚀 PROGRESSO${Colors.reset}`);
  console.log(`${Colors.green}Completati:${Colors.reset} ${stats.completedFiles} (${(stats.completedFiles / stats.totalFiles * 100).toFixed(1)}%)`);
  console.log(`${Colors.yellow}In corso:${Colors.reset} ${stats.inProgressFiles} (${(stats.inProgressFiles / stats.totalFiles * 100).toFixed(1)}%)`);
  console.log(`${Colors.red}In attesa:${Colors.reset} ${stats.pendingFiles} (${(stats.pendingFiles / stats.totalFiles * 100).toFixed(1)}%)`);
  
  // Priorità
  console.log(`\n${Colors.bright}${Colors.yellow}⚠️ PRIORITÀ${Colors.reset}`);
  console.log(`${Colors.red}Alta:${Colors.reset} ${stats.highPriorityFiles} file`);
  console.log(`${Colors.yellow}Media:${Colors.reset} ${stats.mediumPriorityFiles} file`);
  console.log(`${Colors.green}Bassa:${Colors.reset} ${stats.lowPriorityFiles} file`);
  
  // Top 5 files critici
  const criticalFiles = [...report.files]
    .sort((a, b) => {
      // Ordina prima per priorità (high -> medium -> low)
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[a.priority || 'low'];
      const bPriority = priorityOrder[b.priority || 'low'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // A parità di priorità, ordina per numero di 'any'
      return b.anyCount - a.anyCount;
    })
    .slice(0, 5);
  
  console.log(`\n${Colors.bright}${Colors.yellow}🔥 TOP 5 FILE CRITICI${Colors.reset}`);
  criticalFiles.forEach((file, index) => {
    const priorityColor = file.priority === 'high' ? Colors.red : (file.priority === 'medium' ? Colors.yellow : Colors.green);
    console.log(`${index + 1}. ${Colors.cyan}${file.path}${Colors.reset}`);
    console.log(`   Any: ${file.anyCount} | JS Imports: ${file.jsImports} | Priorità: ${priorityColor}${file.priority}${Colors.reset} | Stato: ${file.status}`);
  });
  
  // Trend storico
  console.log(`\n${Colors.bright}${Colors.yellow}📈 TREND STORICO${Colors.reset}`);
  if (trendData.length > 0) {
    console.log(generateAsciiChart(trendData));
  } else {
    console.log(`${Colors.yellow}Nessun dato storico disponibile. Esegui --trend per iniziare a tracciare i progressi.${Colors.reset}`);
  }
  
  // Suggerimenti
  console.log(`\n${Colors.bright}${Colors.yellow}💡 SUGGERIMENTI${Colors.reset}`);
  
  if (stats.highPriorityFiles > 0) {
    console.log(`${Colors.red}⚠️  Concentrati sui ${stats.highPriorityFiles} file ad alta priorità prima.${Colors.reset}`);
  } else if (stats.mediumPriorityFiles > 0) {
    console.log(`${Colors.yellow}📌 Ottimo! Nessun file ad alta priorità. Continua con i ${stats.mediumPriorityFiles} file a media priorità.${Colors.reset}`);
  } else {
    console.log(`${Colors.green}🎉 Fantastico! Solo file a bassa priorità rimasti.${Colors.reset}`);
  }
  
  // Comandi disponibili
  console.log(`\n${Colors.bright}${Colors.yellow}🛠️  COMANDI DISPONIBILI${Colors.reset}`);
  console.log(`${Colors.cyan}pnpm dashboard${Colors.reset}         - Visualizza questa dashboard`);
  console.log(`${Colors.cyan}pnpm dashboard:html${Colors.reset}    - Genera dashboard HTML`);
  console.log(`${Colors.cyan}pnpm dashboard:trend${Colors.reset}   - Aggiorna file trend storico`);
  console.log(`${Colors.cyan}pnpm refactor:report${Colors.reset}   - Genera nuovo report`);
  
  console.log('\n');
}

/**
 * Genera dashboard HTML
 */
function generateHtmlDashboard(report: RefactorMap, trendData: TrendData[]): void {
  const stats = calculateStats(report);
  const lastUpdated = new Date(report.lastUpdated).toLocaleString();
  
  // Ordinamento file per priorità e 'any' count
  const sortedFiles = [...report.files].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const aPriority = priorityOrder[a.priority || 'low'];
    const bPriority = priorityOrder[b.priority || 'low'];
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    return b.anyCount - a.anyCount;
  });
  
  // Prepara dati per grafici e tabelle
  const criticalFiles = sortedFiles.slice(0, 10);
  
  // Dati per il grafico trend
  const trendLabels = trendData.map(d => d.date);
  const trendAnyData = trendData.map(d => d.anyCount);
  const trendJsData = trendData.map(d => d.jsImports);
  
  // Genera HTML
  const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Jarvis Refactor Dashboard</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    h1, h2, h3 {
      color: #0066cc;
    }
    .dashboard-header {
      background-color: #0066cc;
      color: white;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .last-updated {
      font-size: 0.9em;
      opacity: 0.8;
    }
    .stats-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .stat-card {
      background-color: white;
      border-radius: 5px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
    .stat-value {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
      color: #0066cc;
    }
    .progress-container {
      margin-bottom: 30px;
    }
    .progress-bar {
      height: 20px;
      background-color: #e0e0e0;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }
    .progress-fill {
      height: 100%;
      float: left;
    }
    .completed {
      background-color: #4caf50;
    }
    .in-progress {
      background-color: #ff9800;
    }
    .pending {
      background-color: #f44336;
    }
    .chart-container {
      background-color: white;
      border-radius: 5px;
      padding: 20px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      background-color: white;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      border-radius: 5px;
      overflow: hidden;
    }
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }
    th {
      background-color: #0066cc;
      color: white;
    }
    tr:hover {
      background-color: #f5f5f5;
    }
    .priority-high {
      color: #f44336;
      font-weight: bold;
    }
    .priority-medium {
      color: #ff9800;
      font-weight: bold;
    }
    .priority-low {
      color: #4caf50;
    }
    .status-tag {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.8em;
      color: white;
    }
    .status-completed {
      background-color: #4caf50;
    }
    .status-in-progress {
      background-color: #ff9800;
    }
    .status-pending {
      background-color: #f44336;
    }
    .footer {
      text-align: center;
      margin-top: 50px;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="dashboard-header">
    <h1>Jarvis Refactor Dashboard</h1>
    <div class="last-updated">Ultimo aggiornamento: ${lastUpdated}</div>
  </div>
  
  <div class="stats-container">
    <div class="stat-card">
      <h3>File Analizzati</h3>
      <div class="stat-value">${stats.totalFiles}</div>
    </div>
    <div class="stat-card">
      <h3>Tipi 'any'</h3>
      <div class="stat-value">${stats.totalAnyCount}</div>
    </div>
    <div class="stat-card">
      <h3>Import '.js'</h3>
      <div class="stat-value">${stats.totalJsImports}</div>
    </div>
    <div class="stat-card">
      <h3>File con 'any'</h3>
      <div class="stat-value">${stats.filesWithAny}</div>
      <div>${(stats.filesWithAny / stats.totalFiles * 100).toFixed(1)}% del totale</div>
    </div>
    <div class="stat-card">
      <h3>File con '.js' imports</h3>
      <div class="stat-value">${stats.filesWithJs}</div>
      <div>${(stats.filesWithJs / stats.totalFiles * 100).toFixed(1)}% del totale</div>
    </div>
    <div class="stat-card">
      <h3>Priorità Alta</h3>
      <div class="stat-value priority-high">${stats.highPriorityFiles}</div>
      <div>File ad alta priorità</div>
    </div>
  </div>
  
  <div class="progress-container">
    <h2>Stato di Completamento</h2>
    <div class="progress-bar">
      <div class="progress-fill completed" style="width: ${(stats.completedFiles / stats.totalFiles * 100).toFixed(1)}%"></div>
      <div class="progress-fill in-progress" style="width: ${(stats.inProgressFiles / stats.totalFiles * 100).toFixed(1)}%"></div>
      <div class="progress-fill pending" style="width: ${(stats.pendingFiles / stats.totalFiles * 100).toFixed(1)}%"></div>
    </div>
    <div>
      <span style="color: #4caf50; font-weight: bold;">Completati: ${stats.completedFiles} (${(stats.completedFiles / stats.totalFiles * 100).toFixed(1)}%)</span> |
      <span style="color: #ff9800; font-weight: bold;">In corso: ${stats.inProgressFiles} (${(stats.inProgressFiles / stats.totalFiles * 100).toFixed(1)}%)</span> |
      <span style="color: #f44336; font-weight: bold;">In attesa: ${stats.pendingFiles} (${(stats.pendingFiles / stats.totalFiles * 100).toFixed(1)}%)</span>
    </div>
  </div>
  
  <div class="chart-container">
    <h2>Trend Storico</h2>
    ${trendData.length > 0 ? '<canvas id="trendChart"></canvas>' : '<p>Nessun dato storico disponibile. Esegui <code>pnpm dashboard:trend</code> per iniziare a tracciare i progressi.</p>'}
  </div>
  
  <h2>Top 10 File Critici</h2>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Any</th>
        <th>JS Imports</th>
        <th>Priorità</th>
        <th>Stato</th>
      </tr>
    </thead>
    <tbody>
      ${criticalFiles.map(file => `
        <tr>
          <td>${file.path}</td>
          <td>${file.anyCount}</td>
          <td>${file.jsImports}</td>
          <td class="priority-${file.priority}">${file.priority}</td>
          <td><span class="status-tag status-${file.status}">${file.status}</span></td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>Generato da Jarvis Dashboard Tool v1.0.0 | Jarvis IDE | ${new Date().toISOString().split('T')[0]}</p>
  </div>
  
  ${trendData.length > 0 ? `
  <script>
    // Setup del grafico trend
    const ctx = document.getElementById('trendChart').getContext('2d');
    const trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ${JSON.stringify(trendLabels)},
        datasets: [
          {
            label: 'Any Types',
            data: ${JSON.stringify(trendAnyData)},
            borderColor: '#f44336',
            backgroundColor: 'rgba(244, 67, 54, 0.1)',
            tension: 0.1
          },
          {
            label: 'JS Imports',
            data: ${JSON.stringify(trendJsData)},
            borderColor: '#2196f3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Progresso Refactoring nel Tempo'
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Conteggio'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Data'
            }
          }
        }
      }
    });
  </script>
  ` : ''}
</body>
</html>`;

  // Crea la directory 'out' se non esiste
  const outDir = path.dirname(HTML_OUTPUT);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  
  // Scrivi il file HTML
  fs.writeFileSync(HTML_OUTPUT, html);
  
  console.log(`${Colors.green}Dashboard HTML generata: ${HTML_OUTPUT}${Colors.reset}`);
}

/**
 * Funzione principale
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  
  // Carica sempre il report
  const report = loadReport();
  
  // Carica i dati di trend
  const trendData = loadTrendData();
  
  // Processa gli argomenti
  const generateHtml = args.includes('--html');
  const updateTrend = args.includes('--trend');
  const outputJson = args.includes('--json');
  
  // Se è richiesto l'output JSON, genera solo JSON senza interfaccia CLI
  if (outputJson) {
    outputJsonData(report);
    return;
  }

  // Altrimenti, genera HTML o mostra la dashboard CLI
  if (generateHtml) {
    generateHtmlDashboard(report, trendData);
  } else {
    // Mostra la dashboard nel terminale
    displayCliDashboard(report, trendData);
  }
}

// Aggiungi questa funzione per generare l'output JSON
function outputJsonData(reportData: RefactorMap) {
  const jsonOutput = {
    total: reportData.files.length,
    completed: reportData.files.filter(f => f.status === 'completed').length,
    inProgress: reportData.files.filter(f => f.status === 'in-progress').length,
    pending: reportData.files.filter(f => f.status === 'pending').length,
    anyTotal: reportData.totalAnyCount,
    jsImportsTotal: reportData.totalJsImports,
    criticalFiles: reportData.files.filter(f => f.priority !== undefined).map(file => ({
      path: file.path,
      anyCount: file.anyCount,
      jsImports: file.jsImports,
      priority: file.priority,
      status: file.status
    }))
  };
  
  console.log(JSON.stringify(jsonOutput, null, 0));
}

main().catch(error => {
  console.error(`${Colors.red}Errore durante l'esecuzione:${Colors.reset}`, error);
  process.exit(1);
}); 