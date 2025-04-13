/**
 * Reporter module for type-safety-hud
 * Handles dashboard display, report generation, and trend tracking
 */

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';
import { table } from 'table';
import { 
  FileReport, 
  RefactorMap, 
  RefactorStats, 
  TrendDataPoint, 
  JsonOutput 
} from '../types/index.js';

/**
 * Loads a refactor report from a YAML file
 * @param filePath - Path to the YAML file
 * @returns The loaded report
 */
export async function loadReport(filePath: string): Promise<RefactorMap> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf8');
    return yaml.load(fileContent) as RefactorMap;
  } catch (error) {
    throw new Error(`Failed to load report from ${filePath}: ${error}`);
  }
}

/**
 * Saves a refactor report to a YAML file
 * @param report - The report to save
 * @param filePath - Path to save to
 */
export async function saveReport(report: RefactorMap, filePath: string): Promise<void> {
  try {
    const yamlContent = yaml.dump(report, {
      indent: 2,
      lineWidth: 120,
      sortKeys: false,
    });
    await fs.writeFile(filePath, yamlContent, 'utf8');
  } catch (error) {
    throw new Error(`Failed to save report to ${filePath}: ${error}`);
  }
}

/**
 * Displays the refactor dashboard in the terminal
 * @param report - The refactor report
 * @param trendFilePath - Path to the trend file (optional)
 */
export function displayDashboard(report: RefactorMap, trendFilePath?: string): void {
  const stats = calculateStats(report);
  const trendData = trendFilePath ? loadTrendData(trendFilePath) : undefined;
  
  // Header
  console.log(chalk.cyan('╔════════════════════════════════════════════════════════════╗'));
  console.log(chalk.cyan('║                 Type Safety HUD Dashboard                  ║'));
  console.log(chalk.cyan('╚════════════════════════════════════════════════════════════╝'));
  console.log('');

  // Progress
  console.log(chalk.bold(`📊 Overall Progress: ${stats.completionPercentage}% refactored`));
  console.log(generateProgressBar(stats.completionPercentage, 50) + 
    ` ${stats.completed}/${stats.totalFiles} files`);
  console.log('');
  
  // Trend chart if available
  if (trendData && trendData.length > 0) {
    console.log(chalk.bold('📈 Trend (last 5 updates):'));
    displayTrendChart(trendData.slice(-5));
    console.log('');
  }
  
  // Top critical files
  console.log(chalk.bold('🔥 Top Critical Files:'));
  displayCriticalFiles(report.files);
  console.log('');
  
  // Summary by priority
  console.log(chalk.bold('📊 Summary by Priority:'));
  console.log(`  High: ${stats.highPriority} files${stats.highPriority > 0 ? ' (⚠️ critical)' : ''}`);
  console.log(`  Medium: ${stats.mediumPriority} files`);
  console.log(`  Low: ${stats.lowPriority} files`);
  console.log(`  Completed: ${stats.completed} files`);
  console.log('');
  
  // Final stats
  console.log(chalk.dim(`Last updated on: ${new Date(report.generatedAt).toLocaleString()}`));
  console.log(chalk.dim(`Total 'any' types: ${report.totalAnyCount}, Total '.js' imports: ${report.totalJsImports}`));
}

/**
 * Calculates statistics from a refactor report
 * @param report - The report to analyze
 * @returns Statistics object
 */
export function calculateStats(report: RefactorMap): RefactorStats {
  const totalFiles = report.files.length;
  const completed = report.files.filter(f => f.status === 'completed').length;
  const inProgress = report.files.filter(f => f.status === 'in-progress').length;
  const pending = report.files.filter(f => f.status === 'pending').length;
  
  const highPriority = report.files.filter(f => f.priority === 'high').length;
  const mediumPriority = report.files.filter(f => f.priority === 'medium').length;
  const lowPriority = report.files.filter(f => f.priority === 'low').length;
  
  const completionPercentage = totalFiles > 0 
    ? Math.round((completed / totalFiles) * 100) 
    : 0;
  
  return {
    totalFiles,
    completed,
    inProgress,
    pending,
    completionPercentage,
    highPriority,
    mediumPriority,
    lowPriority,
  };
}

/**
 * Generates an ASCII progress bar
 * @param percentage - Percentage to represent
 * @param width - Total width of the bar
 * @returns String representation of the progress bar
 */
function generateProgressBar(percentage: number, width: number): string {
  const filledWidth = Math.round((percentage / 100) * width);
  const emptyWidth = width - filledWidth;
  
  const filled = '█'.repeat(filledWidth);
  const empty = '░'.repeat(emptyWidth);
  
  return `[${chalk.green(filled)}${chalk.gray(empty)}]`;
}

/**
 * Displays the top critical files by priority
 * @param files - List of files to analyze
 * @param count - Number of files to display
 */
function displayCriticalFiles(files: FileReport[], count: number = 5): void {
  // Sort by priority and then by 'any' count
  const sortedFiles = [...files]
    .filter(f => f.status !== 'completed')
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
      const aPriority = priorityOrder[a.priority || 'unknown'];
      const bPriority = priorityOrder[b.priority || 'unknown'];
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      // If same priority, sort by 'any' count
      return b.anyCount - a.anyCount;
    })
    .slice(0, count);
  
  if (sortedFiles.length === 0) {
    console.log('  No critical files found.');
    return;
  }
  
  sortedFiles.forEach((file, index) => {
    console.log(`  ${index + 1}. ${chalk.yellow(file.path)} - ${chalk.red(file.anyCount)} any, ${chalk.blue(file.jsImports)} js imports`);
  });
}

/**
 * Loads and parses trend data from a file
 * @param filePath - Path to the trend file
 * @returns Array of trend data points
 */
function loadTrendData(filePath: string): TrendDataPoint[] {
  try {
    if (!fs.existsSync(filePath)) {
      return [];
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(Boolean);
    
    // Skip header lines
    const dataLines = lines.slice(2);
    
    return dataLines.map(line => {
      const [dateStr, totalStr, completedStr, anyCountStr, jsImportsStr, percentageStr] = line.split('|').map(s => s.trim());
      
      return {
        date: dateStr,
        totalFiles: parseInt(totalStr, 10),
        completedFiles: parseInt(completedStr, 10),
        anyCount: parseInt(anyCountStr, 10),
        jsImports: parseInt(jsImportsStr, 10),
        percentage: parseInt(percentageStr, 10),
      };
    });
  } catch (error) {
    console.error(`Warning: could not load trend data from ${filePath}`);
    return [];
  }
}

/**
 * Displays a simple ASCII chart of trend data
 * @param trendData - The trend data to display
 */
function displayTrendChart(trendData: TrendDataPoint[]): void {
  trendData.forEach(point => {
    const barLength = Math.round(point.percentage / 5); // 5% per character
    const bar = '█'.repeat(barLength);
    console.log(`${point.date} ${chalk.cyan(bar)} ${point.percentage}%`);
  });
}

/**
 * Updates the trend tracking file with the latest data
 * @param report - The current report
 * @param trendFilePath - Path to the trend file
 */
export async function updateTrend(report: RefactorMap, trendFilePath: string): Promise<void> {
  try {
    // Calculate stats
    const stats = calculateStats(report);
    
    // Create trend data point
    const today = new Date().toISOString().split('T')[0];
    const dataPoint = {
      date: today,
      totalFiles: stats.totalFiles,
      completedFiles: stats.completed,
      anyCount: report.totalAnyCount,
      jsImports: report.totalJsImports,
      percentage: stats.completionPercentage,
    };
    
    // Load existing trend data
    let trendData: TrendDataPoint[] = [];
    if (fs.existsSync(trendFilePath)) {
      trendData = loadTrendData(trendFilePath);
    }
    
    // Skip if we already have an entry for today
    const todayExists = trendData.some(point => point.date === today);
    if (!todayExists) {
      trendData.push(dataPoint);
    } else {
      // Replace today's entry
      trendData = trendData.map(point => 
        point.date === today ? dataPoint : point
      );
    }
    
    // Generate markdown table
    const header = `# Type Safety Refactoring Trend\n\n` +
      `| Date | Total Files | Completed | Any Count | JS Imports | Progress |\n` +
      `|------|------------|-----------|-----------|------------|----------|\n`;
    
    const rows = trendData.map(point => 
      `| ${point.date} | ${point.totalFiles} | ${point.completedFiles} | ${point.anyCount} | ${point.jsImports} | ${point.percentage}% |`
    ).join('\n');
    
    // Write to file
    await fs.writeFile(trendFilePath, header + rows, 'utf8');
  } catch (error) {
    throw new Error(`Failed to update trend data: ${error}`);
  }
}

/**
 * Generates an HTML dashboard from the report
 * @param report - The refactor report
 * @param outputPath - Path to save the HTML file
 */
export async function generateHtmlDashboard(report: RefactorMap, outputPath: string): Promise<void> {
  try {
    // Calculate stats
    const stats = calculateStats(report);
    
    // Get trend data if available
    const trendFilePath = outputPath.replace(/\.html$/, '.md');
    const trendData = fs.existsSync(trendFilePath) ? loadTrendData(trendFilePath) : [];
    
    // Sort files for the table
    const sortedFiles = [...report.files].sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2, unknown: 3 };
      const aPriority = priorityOrder[a.priority || 'unknown'];
      const bPriority = priorityOrder[b.priority || 'unknown'];
      return aPriority - bPriority;
    });
    
    // Generate HTML
    const html = generateHtml(report, stats, sortedFiles, trendData);
    
    // Write to file
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html, 'utf8');
  } catch (error) {
    throw new Error(`Failed to generate HTML dashboard: ${error}`);
  }
}

/**
 * Generates HTML content for the dashboard
 * @param report - The refactor report
 * @param stats - Calculated statistics
 * @param files - Sorted file list
 * @param trendData - Historical trend data
 * @returns HTML string
 */
function generateHtml(
  report: RefactorMap, 
  stats: RefactorStats, 
  files: FileReport[],
  trendData: TrendDataPoint[]
): string {
  // Import HTML template instead of hardcoding here
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Type Safety Dashboard</title>
  <style>
    :root {
      --primary-color: #3498db;
      --success-color: #2ecc71;
      --warning-color: #f39c12;
      --danger-color: #e74c3c;
      --info-color: #9b59b6;
      --dark-color: #34495e;
      --light-color: #ecf0f1;
      --text-color: #2c3e50;
      --border-color: #ddd;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: var(--text-color);
      margin: 0;
      padding: 20px;
      background-color: var(--light-color);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      padding: 30px;
    }
    
    h1, h2, h3 {
      margin-top: 0;
      color: var(--dark-color);
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 15px;
    }
    
    .header h1 {
      margin: 0;
    }
    
    .header .meta {
      font-size: 0.9em;
      color: #777;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      background-color: white;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      padding: 20px;
      text-align: center;
    }
    
    .stat-card .number {
      font-size: 2em;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .stat-card.primary { border-top: 3px solid var(--primary-color); }
    .stat-card.success { border-top: 3px solid var(--success-color); }
    .stat-card.warning { border-top: 3px solid var(--warning-color); }
    .stat-card.danger { border-top: 3px solid var(--danger-color); }
    
    .progress-bar {
      height: 20px;
      background-color: #f3f3f3;
      border-radius: 5px;
      margin: 20px 0;
      overflow: hidden;
    }
    
    .progress-bar .progress {
      height: 100%;
      background-color: var(--success-color);
      width: 0; /* Set dynamically */
      transition: width 1s ease;
    }
    
    .chart-container {
      height: 300px;
      margin: 30px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 0.9em;
    }
    
    table th {
      background-color: var(--dark-color);
      color: white;
      padding: 10px;
      text-align: left;
    }
    
    table td {
      padding: 10px;
      border-bottom: 1px solid var(--border-color);
    }
    
    table tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    
    table tr.high {
      background-color: rgba(231, 76, 60, 0.1);
    }
    
    table tr.medium {
      background-color: rgba(243, 156, 18, 0.1);
    }
    
    .filters {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .filters select, .filters input {
      padding: 8px;
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }
    
    .priority-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
      color: white;
    }
    
    .priority-high { background-color: var(--danger-color); }
    .priority-medium { background-color: var(--warning-color); }
    .priority-low { background-color: var(--info-color); }
    
    .status-badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 0.8em;
    }
    
    .status-completed { background-color: #e8f5e9; color: #2e7d32; }
    .status-in-progress { background-color: #e3f2fd; color: #1565c0; }
    .status-pending { background-color: #fff3e0; color: #ef6c00; }
    
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #777;
      font-size: 0.9em;
      border-top: 1px solid var(--border-color);
      padding-top: 20px;
    }
  </style>
  <!-- Chart.js for visualizations -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@3.7.1/dist/chart.min.js"></script>
</head>
<body>
  <div class="container">
    <div class="header">
      <div>
        <h1>Type Safety HUD Dashboard</h1>
        <p>Monitor your TypeScript refactoring progress</p>
      </div>
      <div class="meta">
        <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>Version: ${report.version}</p>
      </div>
    </div>
    
    <div class="stats-grid">
      <div class="stat-card primary">
        <h3>Total Files</h3>
        <div class="number">${stats.totalFiles}</div>
      </div>
      <div class="stat-card success">
        <h3>Completed</h3>
        <div class="number">${stats.completed}</div>
      </div>
      <div class="stat-card warning">
        <h3>In Progress</h3>
        <div class="number">${stats.inProgress}</div>
      </div>
      <div class="stat-card danger">
        <h3>Pending</h3>
        <div class="number">${stats.pending}</div>
      </div>
    </div>
    
    <h2>Progress: ${stats.completionPercentage}%</h2>
    <div class="progress-bar">
      <div class="progress" id="mainProgress"></div>
    </div>
    
    <div class="chart-container">
      <canvas id="trendChart"></canvas>
    </div>
    
    <h2>Files by Priority</h2>
    <div class="filters">
      <select id="priorityFilter">
        <option value="all">All Priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select id="statusFilter">
        <option value="all">All Statuses</option>
        <option value="completed">Completed</option>
        <option value="in-progress">In Progress</option>
        <option value="pending">Pending</option>
      </select>
      <input type="text" id="searchFilter" placeholder="Search files...">
    </div>
    
    <table id="filesTable">
      <thead>
        <tr>
          <th>File</th>
          <th>Any Count</th>
          <th>JS Imports</th>
          <th>Priority</th>
          <th>Status</th>
          <th>Last Modified</th>
        </tr>
      </thead>
      <tbody>
        ${files.map(file => `
          <tr class="${file.priority || ''}">
            <td>${file.path}</td>
            <td>${file.anyCount}</td>
            <td>${file.jsImports}</td>
            <td>
              <span class="priority-badge priority-${file.priority || 'unknown'}">
                ${file.priority || 'Unknown'}
              </span>
            </td>
            <td>
              <span class="status-badge status-${file.status}">
                ${file.status}
              </span>
            </td>
            <td>${file.lastModified ? new Date(file.lastModified).toLocaleString() : 'N/A'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <div class="footer">
      <p>Generated by Type Safety HUD - <a href="https://github.com/jarvis-ai/type-safety-hud">GitHub</a></p>
    </div>
  </div>

  <script>
    // Set progress bar width
    document.getElementById('mainProgress').style.width = '${stats.completionPercentage}%';
    
    // Initialize trend chart
    const trendChart = new Chart(
      document.getElementById('trendChart'),
      {
        type: 'line',
        data: {
          labels: ${JSON.stringify(trendData.map(d => d.date))},
          datasets: [
            {
              label: 'Completion %',
              data: ${JSON.stringify(trendData.map(d => d.percentage))},
              borderColor: '#2ecc71',
              backgroundColor: 'rgba(46, 204, 113, 0.1)',
              tension: 0.1,
              yAxisID: 'y'
            },
            {
              label: 'Any Count',
              data: ${JSON.stringify(trendData.map(d => d.anyCount))},
              borderColor: '#e74c3c',
              backgroundColor: 'rgba(231, 76, 60, 0.1)',
              tension: 0.1,
              yAxisID: 'y1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              position: 'left',
              title: {
                display: true,
                text: 'Completion %'
              }
            },
            y1: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Any Count'
              }
            }
          }
        }
      }
    );
    
    // Table filtering
    const filesTable = document.getElementById('filesTable');
    const tableRows = Array.from(filesTable.querySelectorAll('tbody tr'));
    
    function filterTable() {
      const priorityFilter = document.getElementById('priorityFilter').value;
      const statusFilter = document.getElementById('statusFilter').value;
      const searchFilter = document.getElementById('searchFilter').value.toLowerCase();
      
      tableRows.forEach(row => {
        const priority = row.querySelector('.priority-badge').textContent.trim().toLowerCase();
        const status = row.querySelector('.status-badge').textContent.trim().toLowerCase();
        const filePath = row.cells[0].textContent.toLowerCase();
        
        const priorityMatch = priorityFilter === 'all' || priority === priorityFilter;
        const statusMatch = statusFilter === 'all' || status === statusFilter;
        const searchMatch = filePath.includes(searchFilter);
        
        row.style.display = priorityMatch && statusMatch && searchMatch ? '' : 'none';
      });
    }
    
    document.getElementById('priorityFilter').addEventListener('change', filterTable);
    document.getElementById('statusFilter').addEventListener('change', filterTable);
    document.getElementById('searchFilter').addEventListener('input', filterTable);
  </script>
</body>
</html>`;
}

/**
 * Outputs data in JSON format
 * @param report - The refactor report
 */
export function outputJsonData(report: RefactorMap): void {
  const stats = calculateStats(report);
  
  const jsonOutput: JsonOutput = {
    total: stats.totalFiles,
    completed: stats.completed,
    inProgress: stats.inProgress,
    pending: stats.pending,
    anyTotal: report.totalAnyCount,
    jsImportsTotal: report.totalJsImports,
    criticalFiles: report.files
      .filter(file => file.priority === 'high')
      .map(file => ({
        path: file.path,
        anyCount: file.anyCount,
        jsImports: file.jsImports,
        priority: file.priority || 'unknown',
        status: file.status
      }))
  };
  
  console.log(JSON.stringify(jsonOutput, null, 2));
} 