/**
 * HTML Reporter for Type Safety HUD
 * Generates an HTML dashboard to visualize refactoring progress
 */

import * as fs from 'fs-extra';
import * as path from 'path';
import { RefactorMap, RefactorStats, TrendData } from '../types';
import { 
  calculatePercentage, 
  getColorClass, 
  getPriorityColorClass, 
  getStatusColorClass, 
  getPriorityString, 
  getStatusString 
} from '../utils';

/**
 * Reporter that generates HTML dashboards
 */
export class HtmlReporter {
  /**
   * Generate an HTML report from the refactor map and trend data
   * @param refactorMap The refactor map to generate a report from
   * @param stats The calculated statistics
   * @param trends Optional trend data to include in the report
   * @param outputPath The path to save the HTML report
   */
  public async generateReport(
    refactorMap: RefactorMap,
    stats: RefactorStats,
    trends?: TrendData,
    outputPath?: string
  ): Promise<string> {
    const html = this.generateHtml(refactorMap, stats, trends);
    
    if (outputPath) {
      // Ensure the directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // Write the HTML to file
      await fs.writeFile(outputPath, html, 'utf8');
      console.log(`HTML report saved to ${outputPath}`);
    }
    
    return html;
  }
  
  /**
   * Generate the HTML content
   * @param refactorMap The refactor map
   * @param stats The statistics
   * @param trends Optional trend data
   * @returns HTML string
   */
  private generateHtml(
    refactorMap: RefactorMap,
    stats: RefactorStats,
    trends?: TrendData
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Type Safety Dashboard</title>
  <style>
    :root {
      --primary-color: #4a6ee0;
      --secondary-color: #e9ecef;
      --success-color: #28a745;
      --warning-color: #ffc107;
      --danger-color: #dc3545;
      --light-color: #f8f9fa;
      --dark-color: #343a40;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      padding: 20px;
    }
    
    header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 1px solid var(--secondary-color);
      padding-bottom: 20px;
    }
    
    h1 {
      color: var(--primary-color);
      margin-bottom: 10px;
    }
    
    .timestamp {
      color: #6c757d;
      font-size: 0.9rem;
    }
    
    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    @media (max-width: 768px) {
      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .card {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
      padding: 20px;
      border: 1px solid var(--secondary-color);
    }
    
    .card-title {
      margin-top: 0;
      margin-bottom: 15px;
      color: var(--primary-color);
      font-size: 1.2rem;
      border-bottom: 1px solid var(--secondary-color);
      padding-bottom: 10px;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 15px;
    }
    
    .stat-item {
      text-align: center;
      padding: 15px;
      background-color: var(--light-color);
      border-radius: 6px;
    }
    
    .stat-value {
      font-size: 1.8rem;
      font-weight: bold;
      color: var(--primary-color);
      margin-bottom: 5px;
    }
    
    .stat-label {
      font-size: 0.85rem;
      color: #6c757d;
    }
    
    .progress-container {
      margin-bottom: 15px;
    }
    
    .progress-label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    
    .progress-bar {
      height: 10px;
      background-color: var(--secondary-color);
      border-radius: 5px;
      overflow: hidden;
    }
    
    .progress-value {
      height: 100%;
      border-radius: 5px;
    }
    
    .success { background-color: var(--success-color); }
    .warning { background-color: var(--warning-color); }
    .danger { background-color: var(--danger-color); }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th, td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid var(--secondary-color);
    }
    
    th {
      background-color: var(--light-color);
      font-weight: 600;
    }
    
    tr:hover {
      background-color: rgba(0, 0, 0, 0.02);
    }
    
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
    }
    
    .badge.success { background-color: var(--success-color); }
    .badge.warning { background-color: var(--warning-color); }
    .badge.danger { background-color: var(--danger-color); }
    .badge.default { background-color: #6c757d; }
    
    .suggestions {
      margin-top: 20px;
    }
    
    .suggestion-item {
      padding: 10px 15px;
      margin-bottom: 10px;
      background-color: #e9f5ff;
      border-left: 4px solid var(--primary-color);
      border-radius: 4px;
    }
    
    .chart-container {
      width: 100%;
      height: 250px;
      margin-bottom: 20px;
    }
    
    footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid var(--secondary-color);
      color: #6c757d;
      font-size: 0.9rem;
    }
    
    .file-path {
      font-family: monospace;
      font-size: 0.9rem;
      max-width: 300px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .truncated {
      cursor: pointer;
    }
    
    .truncated:hover {
      color: var(--primary-color);
    }
    
    .notes {
      font-style: italic;
      color: #6c757d;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Type Safety Dashboard</h1>
      <div class="timestamp">Last updated on: ${stats.lastUpdated}</div>
    </header>
    
    <div class="dashboard-grid">
      <div class="card">
        <h2 class="card-title">General Statistics</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${stats.totalFiles}</div>
            <div class="stat-label">Total Files</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.filesWithAny}</div>
            <div class="stat-label">Files with 'any'</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.filesWithJsImports}</div>
            <div class="stat-label">Files with '.js' imports</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.totalAnyCount}</div>
            <div class="stat-label">Total 'any' count</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.totalJsImportsCount}</div>
            <div class="stat-label">Total '.js' imports</div>
          </div>
        </div>
        
        <h3>Files with 'any' types</h3>
        <div class="progress-container">
          <div class="progress-label">
            <span>Progress</span>
            <span>${calculatePercentage(stats.totalFiles - stats.filesWithAny, stats.totalFiles)}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-value ${getColorClass((stats.totalFiles - stats.filesWithAny) / stats.totalFiles * 100)}" 
              style="width: ${calculatePercentage(stats.totalFiles - stats.filesWithAny, stats.totalFiles).replace('%', '')}%">
            </div>
          </div>
        </div>
        
        <h3>Files with '.js' imports</h3>
        <div class="progress-container">
          <div class="progress-label">
            <span>Progress</span>
            <span>${calculatePercentage(stats.totalFiles - stats.filesWithJsImports, stats.totalFiles)}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-value ${getColorClass((stats.totalFiles - stats.filesWithJsImports) / stats.totalFiles * 100)}" 
              style="width: ${calculatePercentage(stats.totalFiles - stats.filesWithJsImports, stats.totalFiles).replace('%', '')}%">
            </div>
          </div>
        </div>
      </div>
      
      <div class="card">
        <h2 class="card-title">Progress</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${stats.completed}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.inProgress}</div>
            <div class="stat-label">In Progress</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.pending}</div>
            <div class="stat-label">Pending</div>
          </div>
        </div>
        
        <h3>Overall Progress</h3>
        <div class="progress-container">
          <div class="progress-label">
            <span>Progress</span>
            <span>${calculatePercentage(stats.completed, stats.totalFiles)}</span>
          </div>
          <div class="progress-bar">
            <div 
              class="progress-value ${getColorClass(stats.completed / stats.totalFiles * 100)}" 
              style="width: ${calculatePercentage(stats.completed, stats.totalFiles).replace('%', '')}%">
            </div>
          </div>
        </div>
        
        <h2 class="card-title">Priority</h2>
        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-value">${stats.highPriority}</div>
            <div class="stat-label">High Priority</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.mediumPriority}</div>
            <div class="stat-label">Medium Priority</div>
          </div>
          <div class="stat-item">
            <div class="stat-value">${stats.lowPriority}</div>
            <div class="stat-label">Low Priority</div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <h2 class="card-title">Top Critical Files</h2>
      <table>
        <thead>
          <tr>
            <th>File Path</th>
            <th>'any' Types</th>
            <th>'.js' Imports</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          ${stats.criticalFiles.map(file => `
            <tr>
              <td class="file-path truncated" title="${file.filePath}">${file.filePath}</td>
              <td>${file.anyCount}</td>
              <td>${file.jsImportsCount}</td>
              <td><span class="badge ${getPriorityColorClass(file.priority)}">${getPriorityString(file.priority)}</span></td>
              <td><span class="badge ${getStatusColorClass(file.status)}">${getStatusString(file.status)}</span></td>
              <td class="notes" title="${file.notes || ''}">${file.notes || '-'}</td>
            </tr>
          `).join('')}
          ${stats.criticalFiles.length === 0 ? '<tr><td colspan="6" style="text-align: center;">No critical files found</td></tr>' : ''}
        </tbody>
      </table>
    </div>
    
    ${trends ? `
    <div class="card">
      <h2 class="card-title">Historical Trend</h2>
      <div class="chart-container">
        <canvas id="trendChart"></canvas>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const ctx = document.getElementById('trendChart').getContext('2d');
          
          const trendData = ${JSON.stringify(trends)};
          const labels = trendData.dates;
          const anyData = trendData.anyTypeCounts;
          const jsImportsData = trendData.jsImportCounts;
          const completedData = trendData.completedCounts;
          
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [
                {
                  label: 'Any Types',
                  data: anyData,
                  borderColor: '#dc3545',
                  backgroundColor: 'rgba(220, 53, 69, 0.1)',
                  borderWidth: 2,
                  tension: 0.1
                },
                {
                  label: '.js Imports',
                  data: jsImportsData,
                  borderColor: '#ffc107',
                  backgroundColor: 'rgba(255, 193, 7, 0.1)',
                  borderWidth: 2,
                  tension: 0.1
                },
                {
                  label: 'Completed Files',
                  data: completedData,
                  borderColor: '#28a745',
                  backgroundColor: 'rgba(40, 167, 69, 0.1)',
                  borderWidth: 2,
                  tension: 0.1
                }
              ]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: {
                    display: true,
                    text: 'Count'
                  }
                },
                x: {
                  title: {
                    display: true,
                    text: 'Date'
                  }
                }
              },
              plugins: {
                tooltip: {
                  mode: 'index',
                  intersect: false
                },
                legend: {
                  position: 'top'
                }
              }
            }
          });
        });
      </script>
    </div>
    ` : ''}
    
    <div class="card suggestions">
      <h2 class="card-title">Suggestions</h2>
      ${stats.suggestions?.map(suggestion => `
        <div class="suggestion-item">${suggestion}</div>
      `).join('') || '<div class="suggestion-item">Continue refactoring files based on their priority level for best results.</div>'}
    </div>
    
    <footer>
      <p>Generated by Type Safety HUD | ${new Date().getFullYear()}</p>
    </footer>
  </div>
  
  <script>
    // Enable tooltip behavior for truncated file paths
    document.querySelectorAll('.truncated').forEach(element => {
      element.addEventListener('click', function() {
        const selection = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(this);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    });
  </script>
</body>
</html>
    `;
  }
}