#!/usr/bin/env node

/**
 * Badge Generator per SafeMessage
 * 
 * Questo script genera un badge SVG per il README che indica lo stato
 * della sicurezza dei messaggi nel codebase.
 * 
 * - Badge verde se non ci sono problemi
 * - Badge giallo se ci sono pochi problemi (< 10)
 * - Badge rosso se ci sono molti problemi (>= 10)
 */

import fs from 'fs';
import path from 'path';

// Configurazione
const REPORTS_DIR = path.join(process.cwd(), 'reports');
const BADGE_DIR = path.join(REPORTS_DIR, 'badges');
const BADGE_PATH = path.join(BADGE_DIR, 'safe-message-status.svg');
const README_PATH = path.join(process.cwd(), 'README.md');
const BADGE_PLACEHOLDER = '<!-- SAFE_MESSAGE_BADGE -->';

// Interfaccia per il formato del report JSON (semplificata)
interface SafetyReportData {
  issues: { file: string; line: number; type: string; message: string; code?: string }[];
}

// Trova il report JSON più recente
function findLatestReport(): string | null {
  if (!fs.existsSync(REPORTS_DIR)) {
    console.error(`❌ La directory dei report non esiste: ${REPORTS_DIR}`);
    return null;
  }

  const jsonFiles = fs.readdirSync(REPORTS_DIR)
    .filter(file => file.startsWith('safety-report-') && file.endsWith('.json'))
    .map(file => ({ name: file, time: fs.statSync(path.join(REPORTS_DIR, file)).mtimeMs }))
    .sort((a, b) => b.time - a.time);

  if (jsonFiles.length === 0) {
    console.warn('⚠️ Nessun report JSON di sicurezza trovato');
    return null;
  }

  return path.join(REPORTS_DIR, jsonFiles[0].name);
}

// Genera il contenuto SVG del badge
function generateBadgeSvg(issueCount: number): string {
  let color, status, message;
  
  if (issueCount === 0) {
    color = '#4c1'; // Verde brillante
    status = 'passed';
    message = '✅ Passed';
  } else if (issueCount > 0 && issueCount < 10) {
    color = '#dfb317'; // Giallo
    status = 'warning';
    message = `⚠️ ${issueCount} issues`;
  } else if (issueCount >= 10) {
    color = '#e05d44'; // Rosso
    status = 'failed';
    message = `❌ ${issueCount} issues`;
  } else {
    color = '#9f9f9f'; // Grigio
    status = 'unknown';
    message = '❓ Unknown';
  }
  
  const label = 'SafeMessage';
  const labelWidth = label.length * 6 + 10;
  const messageWidth = message.length * 6 + 10;
  const totalWidth = labelWidth + messageWidth;

  // Template SVG
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${label}: ${message}">
    <title>${label}: ${message}</title>
    <linearGradient id="s" x2="0" y2="100%">
      <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
      <stop offset="1" stop-opacity=".1"/>
    </linearGradient>
    <clipPath id="r">
      <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
    </clipPath>
    <g clip-path="url(#r)">
      <rect width="${labelWidth}" height="20" fill="#555"/>
      <rect x="${labelWidth}" width="${messageWidth}" height="20" fill="${color}"/>
      <rect width="${totalWidth}" height="20" fill="url(#s)"/>
    </g>
    <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
      <text aria-hidden="true" x="${labelWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(labelWidth-10)*10}">${label}</text>
      <text x="${labelWidth * 5}" y="140" transform="scale(.1)" fill="#fff" textLength="${(labelWidth-10)*10}">${label}</text>
      <text aria-hidden="true" x="${labelWidth * 10 + messageWidth * 5}" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="${(messageWidth-10)*10}">${message}</text>
      <text x="${labelWidth * 10 + messageWidth * 5}" y="140" transform="scale(.1)" fill="#fff" textLength="${(messageWidth-10)*10}">${message}</text>
    </g>
  </svg>`;
}

// Aggiorna il README con il riferimento al badge SVG locale
function updateReadme(badgeRelativePath: string): boolean {
  if (!fs.existsSync(README_PATH)) {
    console.warn(`⚠️ README non trovato: ${README_PATH}`);
    return false;
  }
  
  let content = fs.readFileSync(README_PATH, 'utf8');
  
  if (!content.includes(BADGE_PLACEHOLDER)) {
    console.warn(`⚠️ Placeholder ${BADGE_PLACEHOLDER} non trovato nel README. Aggiungilo manualmente.`);
    console.log(`ℹ️ Placeholder ${BADGE_PLACEHOLDER} aggiunto all'inizio del README.`);
    content = `${BADGE_PLACEHOLDER}\n\n${content}`;
  }
  
  // Crea il markdown per il badge
  const badgeMarkdown = `![SafeMessage Status](${badgeRelativePath.replace(/\\/g, '/')})`;
  
  // Sostituisci il placeholder
  content = content.replace(BADGE_PLACEHOLDER, badgeMarkdown);
  
  fs.writeFileSync(README_PATH, content);
  console.log('✅ README aggiornato con il badge di sicurezza.');
  return true;
}

// Funzione principale
function runBadgeGenerator(): void {
  console.log('🚀 Generazione badge SafeMessage...');
  
  try {
    const latestReportPath = findLatestReport();
    let issueCount = -1;

    if (latestReportPath) {
      try {
        const reportJson = fs.readFileSync(latestReportPath, 'utf8');
        const reportData: SafetyReportData = JSON.parse(reportJson);
        if (reportData && Array.isArray(reportData.issues)) {
          issueCount = reportData.issues.length;
          console.log(`📊 Report più recente: ${path.basename(latestReportPath)}`);
          console.log(`🔧 Problemi trovati: ${issueCount}`);
        } else {
          console.warn('⚠️ Formato report non valido o array issues mancante.');
          issueCount = -1;
        }
      } catch(parseError: unknown) {
        console.error(`❌ Errore nel parsing del report JSON ${latestReportPath}:`, parseError instanceof Error ? parseError.message : parseError);
        issueCount = -1;
      }
    } else {
      console.warn('Nessun report JSON trovato, badge avrà stato sconosciuto.');
    }
    
    const badgeSvg = generateBadgeSvg(issueCount);
    
    if (!fs.existsSync(BADGE_DIR)) {
      fs.mkdirSync(BADGE_DIR, { recursive: true });
    }
    
    fs.writeFileSync(BADGE_PATH, badgeSvg);
    const relativeBadgePath = path.relative(process.cwd(), BADGE_PATH);
    console.log(`🛡️ Badge generato: ${relativeBadgePath}`);
    
    updateReadme(relativeBadgePath);
    
  } catch (error: unknown) {
    console.error('❌ Errore durante la generazione del badge:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Esegui lo script