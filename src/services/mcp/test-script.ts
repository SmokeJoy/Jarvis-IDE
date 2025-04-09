/**
 * @file test-script.ts
 * @description Script di test per McpDispatcher
 * 
 * Questo script può essere eseguito manualmente per testare il funzionamento
 * del McpDispatcher e degli handler implementati.
 * 
 * Simula l'invio di un messaggio di tipo llm.query con un tool_call per read_file,
 * search_docs, memory.query o project.summary.
 */

import * as vscode from 'vscode';
import type { McpDispatcher } from './McpDispatcher.js.js';
import type { WebviewMessage } from '../../shared/protocols.js.js';
import { McpToolCall } from '../../shared/types/mcp.types.js.js';

// Funzione di test
export async function testMcpDispatcher() {
    // Crea una funzione di callback per ricevere le risposte
    const sendResponse = (response: WebviewMessage) => {
        try {
            if (response.type === 'llm.result' || response.type === 'llm.streaming' || response.type === 'llm.error') {
                const payload = response.payload;
                const output = typeof payload.result === 'string' ? payload.result : JSON.stringify(payload.result, null, 2);
                const errorPanel = vscode.window.createOutputChannel('MCP Test Result');
                errorPanel.clear();
                errorPanel.appendLine('=== Risultato Tool Call ===');
                errorPanel.appendLine(`Tool: ${toolCall?.tool || 'n/a'}`);
                errorPanel.appendLine(`RequestId: ${payload.requestId || 'n/a'}`);
                errorPanel.appendLine('');
                
                if (response.type === 'llm.error') {
                    errorPanel.appendLine(`ERRORE: ${payload.error}`);
                } else {
                    errorPanel.appendLine(output);
                }
                
                errorPanel.show();
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Errore nella gestione della risposta: ${error}`);
        }
    };

    // Crea il dispatcher
    const dispatcher = new McpDispatcher(sendResponse);

    // Chiedi all'utente quale tool testare
    const tool = await vscode.window.showQuickPick(
        ['read_file', 'search_docs', 'memory.query', 'project.summary', 'code.generate', 'fs.write', 'refactor.snippet', 'ask.docs', 'project.lint', 'fs.format', 'test.run', 'project.depgraph', 'context.inject', 'context.list', 'context.clear', 'context.tag', 'context.searchByTags'],
        { placeHolder: 'Seleziona il tool da testare', canPickMany: false }
    );

    if (!tool) {
        vscode.window.showInformationMessage('Test annullato.');
        return;
    }

    let toolCall: McpToolCall | undefined;

    if (tool === 'read_file') {
        // Chiedi il percorso del file
        const path = await vscode.window.showInputBox({
            placeHolder: 'Inserisci il percorso del file da leggere'
        });

        if (!path) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Crea una chiamata tool per read_file
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'read_file',
            args: { path }
        };

        vscode.window.showInformationMessage(`Invio richiesta per leggere il file: ${path}`);
    } else if (tool === 'search_docs') {
        // Chiedi la query di ricerca
        const query = await vscode.window.showInputBox({
            placeHolder: 'Inserisci il testo o pattern regex da cercare'
        });

        if (!query) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi se usare regex
        const useRegex = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Usare regex?', canPickMany: false }
        );

        // Chiedi il numero massimo di risultati
        const maxResults = await vscode.window.showQuickPick(
            ['3', '5', '10', '20'],
            { placeHolder: 'Numero massimo di risultati', canPickMany: false }
        );

        // Crea una chiamata tool per search_docs
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'search_docs',
            args: {
                query,
                regex: useRegex === 'Sì',
                maxResults: maxResults ? parseInt(maxResults) : 5
            }
        };

        vscode.window.showInformationMessage(`Invio richiesta per cercare: ${query} (regex: ${useRegex === 'Sì' ? 'sì' : 'no'})`);
    } else if (tool === 'memory.query') {
        // Chiedi l'ambito
        const scope = await vscode.window.showQuickPick(
            ['chat', 'project', 'agent', 'all'],
            { placeHolder: 'Seleziona l\'ambito della memoria', canPickMany: false }
        );

        if (!scope) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il filtro (opzionale)
        const filter = await vscode.window.showInputBox({
            placeHolder: 'Filtra per parola o frase (opzionale)'
        });

        // Chiedi il limite
        const limit = await vscode.window.showQuickPick(
            ['3', '5', '10', '20'],
            { placeHolder: 'Numero massimo di risultati', canPickMany: false }
        );

        // Crea una chiamata tool per memory.query
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'memory.query',
            args: {
                scope,
                filter: filter || undefined,
                limit: limit ? parseInt(limit) : 5
            }
        };

        const filterInfo = filter ? ` con filtro "${filter}"` : '';
        vscode.window.showInformationMessage(`Invio richiesta per memoria: ${scope}${filterInfo} (max: ${limit || '5'})`);
    } else if (tool === 'code.generate') {
        // Chiedi il linguaggio
        const language = await vscode.window.showQuickPick(
            ['TypeScript', 'Python', 'JavaScript', 'Java', 'C#'],
            { placeHolder: 'Seleziona il linguaggio', canPickMany: false }
        );

        if (!language) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi la descrizione
        const description = await vscode.window.showInputBox({
            placeHolder: 'Descrizione del codice da generare'
        });

        if (!description) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il file di contesto (opzionale)
        const contextFile = await vscode.window.showInputBox({
            placeHolder: 'File di contesto (opzionale)'
        });

        // Crea una chiamata tool per code.generate
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'code.generate',
            args: {
                language,
                description,
                contextFile: contextFile || undefined
            }
        };

        const contextInfo = contextFile ? ` (contesto: ${contextFile})` : '';
        vscode.window.showInformationMessage(`Invio richiesta per generare codice ${language}${contextInfo}`);
    } else if (tool === 'fs.write') {
        // Chiedi il percorso del file da scrivere
        const path = await vscode.window.showInputBox({
            placeHolder: 'Percorso del file da scrivere'
        });

        if (!path) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il contenuto
        const content = await vscode.window.showInputBox({
            placeHolder: 'Contenuto del file (testo semplice)'
        });

        if (!content) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi se sovrascrivere
        const overwrite = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Sovrascrivere se esiste?', canPickMany: false }
        );

        // Chiedi se usare preview
        const previewOnly = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Solo anteprima (senza scrivere)?', canPickMany: false }
        );

        // Crea una chiamata tool per fs.write
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'fs.write',
            args: {
                path,
                content,
                overwrite: overwrite === 'Sì',
                previewOnly: previewOnly === 'Sì'
            }
        };

        const modeInfo = previewOnly === 'Sì' ? 'anteprima' : (overwrite === 'Sì' ? 'sovrascrittura' : 'scrittura');
        vscode.window.showInformationMessage(`Invio richiesta per ${modeInfo} file: ${path}`);
    } else if (tool === 'refactor.snippet') {
        // Chiedi il linguaggio
        const language = await vscode.window.showQuickPick(
            ['TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'PHP'],
            { placeHolder: 'Seleziona il linguaggio del codice', canPickMany: false }
        );

        if (!language) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il codice da rifattorizzare
        const code = await vscode.window.showInputBox({
            prompt: 'Inserisci il codice da rifattorizzare',
            placeHolder: 'Incolla qui il codice da rifattorizzare',
            multiline: true
        });

        if (!code) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi l'obiettivo del refactoring
        const objective = await vscode.window.showInputBox({
            prompt: 'Obiettivo del refactoring',
            placeHolder: 'es. Migliorare leggibilità, Ridurre complessità, Ottimizzare performance...'
        });

        if (!objective) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi se includere spiegazione
        const explanation = await vscode.window.showQuickPick(
            ['Sì', 'No'],
            { placeHolder: 'Includere spiegazione delle modifiche?', canPickMany: false }
        );

        // Crea una chiamata tool per refactor.snippet
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'refactor.snippet',
            args: {
                language,
                code,
                objective,
                explanation: explanation === 'Sì'
            }
        };

        vscode.window.showInformationMessage(`Invio richiesta per refactoring ${language}: ${objective}`);
    } else if (tool === 'ask.docs') {
        // Chiedi la domanda
        const question = await vscode.window.showInputBox({
            placeHolder: 'Inserisci una domanda sulla codebase'
        });

        if (!question) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il filtro (opzionale)
        const filter = await vscode.window.showInputBox({
            placeHolder: 'Filtro opzionale (es: README, file:utils.ts)'
        });

        // Chiedi il numero massimo di file sorgente
        const maxSourceFiles = await vscode.window.showQuickPick(
            ['3', '5', '10', '15'],
            { placeHolder: 'Numero massimo di file sorgente', canPickMany: false }
        );

        // Chiedi se includere snippets di codice
        const includeCode = await vscode.window.showQuickPick(
            ['Sì', 'No'],
            { placeHolder: 'Includere snippets di codice?', canPickMany: false }
        );

        // Crea una chiamata tool per ask.docs
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'ask.docs',
            args: {
                question,
                filter: filter || undefined,
                maxSourceFiles: maxSourceFiles ? parseInt(maxSourceFiles) : 5,
                includeCode: includeCode === 'Sì'
            }
        };

        const filterInfo = filter ? ` con filtro "${filter}"` : '';
        vscode.window.showInformationMessage(`Invio richiesta per documentazione: ${question}${filterInfo}`);
    } else if (tool === 'project.lint') {
        // Chiedi il percorso del file/directory
        const path = await vscode.window.showInputBox({
            placeHolder: 'Percorso del file o directory da analizzare'
        });

        if (!path) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il linguaggio (opzionale)
        const language = await vscode.window.showQuickPick(
            ['Auto-rilevamento', 'typescript', 'javascript', 'python'],
            { placeHolder: 'Linguaggio da analizzare', canPickMany: false }
        );

        // Chiedi se applicare le correzioni
        const shouldFix = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Applicare le correzioni automatiche?', canPickMany: false }
        );

        // Crea una chiamata tool per project.lint
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'project.lint',
            args: {
                path,
                language: language === 'Auto-rilevamento' ? undefined : language,
                fix: shouldFix === 'Sì'
            }
        };

        const langInfo = language === 'Auto-rilevamento' ? ' (linguaggio auto-rilevato)' : ` (${language})`;
        const fixInfo = shouldFix === 'Sì' ? ' con correzioni automatiche' : '';
        vscode.window.showInformationMessage(`Invio richiesta per analisi linting: ${path}${langInfo}${fixInfo}`);
    } else if (tool === 'fs.format') {
        // Chiedi il percorso del file
        const path = await vscode.window.showInputBox({
            placeHolder: 'Percorso del file da formattare'
        });

        if (!path) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il linguaggio (opzionale)
        const language = await vscode.window.showQuickPick(
            ['Auto-rilevamento', 'typescript', 'javascript', 'python', 'json', 'markdown', 'html', 'css', 'c', 'cpp', 'go'],
            { placeHolder: 'Linguaggio del file', canPickMany: false }
        );

        // Chiedi se scrivere il file
        const write = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Scrivere il file formattato?', canPickMany: false }
        );

        // Crea una chiamata tool per fs.format
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'fs.format',
            args: {
                path,
                language: language === 'Auto-rilevamento' ? undefined : language,
                write: write === 'Sì'
            }
        };

        const langInfo = language === 'Auto-rilevamento' ? ' (linguaggio auto-rilevato)' : ` (${language})`;
        const writeInfo = write === 'Sì' ? ' con scrittura file' : ' (solo anteprima)';
        vscode.window.showInformationMessage(`Invio richiesta per formattazione: ${path}${langInfo}${writeInfo}`);
    } else if (tool === 'test.run') {
        // Chiedi il percorso dei test (opzionale)
        const path = await vscode.window.showInputBox({
            placeHolder: 'Percorso dei test da eseguire (lascia vuoto per tutti i test)',
            prompt: 'Inserisci il percorso relativo alla directory del progetto'
        });

        // Chiedi il framework
        const framework = await vscode.window.showQuickPick(
            ['jest', 'pytest', 'mocha', 'vitest'],
            { placeHolder: 'Framework di test da utilizzare', canPickMany: false }
        );

        if (!framework) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il filtro (opzionale)
        const filter = await vscode.window.showInputBox({
            placeHolder: 'Filtro test (opzionale)',
            prompt: 'Inserisci un pattern per filtrare i test da eseguire'
        });

        // Chiedi se generare report di copertura
        const coverage = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Generare report di copertura?', canPickMany: false }
        );

        // Crea una chiamata tool per test.run
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'test.run',
            args: {
                path: path || undefined,
                framework,
                filter: filter || undefined,
                coverage: coverage === 'Sì'
            }
        };

        let message = `Invio richiesta per eseguire test ${framework}`;
        if (path) message += ` in ${path}`;
        if (filter) message += ` (filtro: ${filter})`;
        if (coverage === 'Sì') message += ' con report di copertura';
        
        vscode.window.showInformationMessage(message);
    } else if (tool === 'project.depgraph') {
        // Chiedi il punto di ingresso
        const entryPoint = await vscode.window.showInputBox({
            placeHolder: 'Punto di ingresso per l\'analisi delle dipendenze',
            prompt: 'Inserisci il percorso relativo alla directory del progetto',
            value: '.'
        });

        if (!entryPoint) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi la profondità
        const depthInput = await vscode.window.showInputBox({
            placeHolder: 'Profondità massima (opzionale, 1-10)',
            prompt: 'Inserisci un numero da 1 a 10 o lascia vuoto per nessun limite'
        });

        // Converte in numero, se inserito
        const depth = depthInput ? parseInt(depthInput, 10) : undefined;

        // Chiedi il formato
        const format = await vscode.window.showQuickPick(
            ['json', 'dot', 'tree'],
            { placeHolder: 'Formato di output', canPickMany: false }
        );

        if (!format) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Crea una chiamata tool per project.depgraph
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'project.depgraph',
            args: {
                entryPoint,
                depth,
                format
            }
        };

        let message = `Invio richiesta per generare grafo delle dipendenze da '${entryPoint}'`;
        if (depth) message += ` (profondità: ${depth})`;
        message += ` in formato ${format}`;
        
        vscode.window.showInformationMessage(message);
    } else if (tool === 'context.inject') {
        // Chiedi lo scope
        const scope = await vscode.window.showQuickPick(
            ['chat', 'project', 'agent'],
            { placeHolder: 'Seleziona lo scope della memoria', canPickMany: false }
        );

        if (!scope) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il testo da iniettare
        const text = await vscode.window.showInputBox({
            placeHolder: 'Testo da iniettare nel contesto',
            prompt: 'Inserisci il contenuto testuale da aggiungere alla memoria'
        });

        if (!text) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Crea una chiamata tool per context.inject
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'context.inject',
            args: {
                scope,
                text
            }
        };

        vscode.window.showInformationMessage(`Invio richiesta per iniettare contesto in scope '${scope}'`);
    } else if (tool === 'context.list') {
        // Chiedi l'ambito
        const scope = await vscode.window.showQuickPick(
            ['Tutti gli scope', 'chat', 'project', 'agent'],
            { placeHolder: 'Seleziona l\'ambito della memoria da elencare', canPickMany: false }
        );

        if (!scope) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi il limite (opzionale)
        const limitInput = await vscode.window.showInputBox({
            placeHolder: 'Limite di risultati (opzionale, default: 50)',
            prompt: 'Inserisci un numero intero per limitare i risultati'
        });

        // Chiedi il filtro testo (opzionale)
        const filterText = await vscode.window.showInputBox({
            placeHolder: 'Filtro testo (opzionale)',
            prompt: 'Inserisci un testo per filtrare i risultati (lascia vuoto per nessun filtro)'
        });
        
        // Chiedi se vuole filtrare per tag
        const wantTags = await vscode.window.showQuickPick(
            ['No', 'Sì'],
            { placeHolder: 'Vuoi filtrare per tag?', canPickMany: false }
        );
        
        // Se sì, chiedi i tag
        let tagsList: string[] | undefined;
        if (wantTags === 'Sì') {
            const tagsInput = await vscode.window.showInputBox({
                placeHolder: 'Tag (separati da virgola)',
                prompt: 'Inserisci i tag per filtrare i risultati (es. architettura,performance)'
            });
            
            if (tagsInput) {
                tagsList = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            }
        }

        // Crea una chiamata tool per context.list
        const args: any = {};
        
        // Aggiungi solo lo scope se non è "Tutti gli scope"
        if (scope && scope !== 'Tutti gli scope') {
            args.scope = scope;
        }
        
        // Aggiungi limit se specificato
        if (limitInput && !isNaN(parseInt(limitInput))) {
            args.limit = parseInt(limitInput);
        }
        
        // Aggiungi filterText se specificato
        if (filterText) {
            args.filterText = filterText;
        }
        
        // Aggiungi tags se specificati
        if (tagsList && tagsList.length > 0) {
            args.tags = tagsList;
        }
        
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'context.list',
            args
        };

        let message = `Invio richiesta per elencare contesti`;
        if (scope && scope !== 'Tutti gli scope') message += ` in scope '${scope}'`;
        if (filterText) message += ` con filtro testo '${filterText}'`;
        if (tagsList && tagsList.length > 0) message += ` con tag '${tagsList.join(', ')}'`;
        if (limitInput && !isNaN(parseInt(limitInput))) message += ` (limite: ${limitInput})`;
        
        vscode.window.showInformationMessage(message);
    } else if (tool === 'context.clear') {
        // Chiedi la modalità di cancellazione
        const clearMode = await vscode.window.showQuickPick(
            ['Cancella per ID', 'Cancella tutto in uno scope', 'Cancella tutto globalmente'],
            { placeHolder: 'Seleziona la modalità di cancellazione', canPickMany: false }
        );

        if (!clearMode) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Crea una chiamata tool per context.clear
        const args: any = {};
        
        if (clearMode === 'Cancella per ID') {
            // Chiedi l'ID da cancellare
            const id = await vscode.window.showInputBox({
                placeHolder: 'ID del contesto da eliminare',
                prompt: 'Inserisci l\'ID univoco del contesto da eliminare'
            });
            
            if (!id) {
                vscode.window.showInformationMessage('Test annullato.');
                return;
            }
            
            args.id = id;
            
            // Opzionalmente, chiedi lo scope per limitare la ricerca
            const wantScope = await vscode.window.showQuickPick(
                ['No', 'Sì'],
                { placeHolder: 'Limitare la ricerca a uno scope specifico?', canPickMany: false }
            );
            
            if (wantScope === 'Sì') {
                const scope = await vscode.window.showQuickPick(
                    ['chat', 'project', 'agent'],
                    { placeHolder: 'Seleziona lo scope', canPickMany: false }
                );
                
                if (scope) {
                    args.scope = scope;
                }
            }
        } else if (clearMode === 'Cancella tutto in uno scope') {
            // Imposta all a true
            args.all = true;
            
            // Chiedi lo scope
            const scope = await vscode.window.showQuickPick(
                ['chat', 'project', 'agent'],
                { placeHolder: 'Seleziona lo scope da cancellare completamente', canPickMany: false }
            );
            
            if (!scope) {
                vscode.window.showInformationMessage('Test annullato.');
                return;
            }
            
            args.scope = scope;
        } else if (clearMode === 'Cancella tutto globalmente') {
            // Imposta all a true, senza scope (cancella tutto)
            args.all = true;
            
            // Chiedi conferma
            const confirmation = await vscode.window.showQuickPick(
                ['No', 'Sì'],
                { placeHolder: 'Sei sicuro di voler cancellare TUTTI i contesti in TUTTI gli scope?', canPickMany: false }
            );
            
            if (confirmation !== 'Sì') {
                vscode.window.showInformationMessage('Test annullato.');
                return;
            }
        }
        
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'context.clear',
            args
        };
        
        let message = `Invio richiesta per cancellare contesti`;
        if (args.id) message += ` con ID '${args.id}'`;
        if (args.scope) message += ` nello scope '${args.scope}'`;
        if (args.all && !args.scope) message += ` (TUTTI gli scope)`;
        
        vscode.window.showInformationMessage(message);
    } else if (tool === 'context.tag') {
        // Chiedi l'ID del contesto
        const id = await vscode.window.showInputBox({
            placeHolder: 'ID del contesto da taggare',
            prompt: 'Inserisci l\'ID univoco del contesto a cui aggiungere i tag'
        });
        
        if (!id) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }
        
        // Chiedi i tag da aggiungere
        const tagsInput = await vscode.window.showInputBox({
            placeHolder: 'Tag (separati da virgola)',
            prompt: 'Inserisci i tag da associare al contesto (es. architettura,performance,best-practice)'
        });
        
        if (!tagsInput) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }
        
        // Converti l'input in array di tag
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        if (tags.length === 0) {
            vscode.window.showInformationMessage('Nessun tag valido specificato. Test annullato.');
            return;
        }
        
        // Chiedi se sostituire i tag esistenti
        const replace = await vscode.window.showQuickPick(
            ['No, aggiungi ai tag esistenti', 'Sì, sostituisci i tag esistenti'],
            { placeHolder: 'Vuoi sostituire i tag esistenti?', canPickMany: false }
        );
        
        if (!replace) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }
        
        // Crea una chiamata tool per context.tag
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'context.tag',
            args: {
                id,
                tags,
                replace: replace === 'Sì, sostituisci i tag esistenti'
            }
        };
        
        vscode.window.showInformationMessage(`Invio richiesta per ${replace === 'Sì, sostituisci i tag esistenti' ? 'sostituire' : 'aggiungere'} tag al contesto con ID '${id}'`);
    } else if (tool === 'context.searchByTags') {
        // Chiedi i tag da cercare
        const searchTagsInput = await vscode.window.showInputBox({
            placeHolder: "Tag da cercare (separati da virgola)",
            prompt: "Inserisci i tag per la ricerca (es. architettura,performance)"
        });
        
        if (!searchTagsInput) {
            vscode.window.showInformationMessage("Test annullato.");
            return;
        }
        
        const searchTags = searchTagsInput.split(",").map(tag => tag.trim()).filter(tag => tag.length > 0);
        
        if (searchTags.length === 0) {
            vscode.window.showInformationMessage("Nessun tag valido specificato. Test annullato.");
            return;
        }
        
        // Chiedi lo scope (opzionale)
        const searchScope = await vscode.window.showQuickPick(
            ["Tutti gli scope", "chat", "project", "agent"],
            { placeHolder: "Seleziona lo scope di ricerca (opzionale)" }
        );
        
        // Chiedi il limite (opzionale)
        const searchLimitInput = await vscode.window.showInputBox({
            placeHolder: "Limite di risultati (opzionale, default: 50)",
            prompt: "Inserisci un numero intero per limitare i risultati"
        });
        
        // Chiedi la soglia di similarità (opzionale)
        const similarityThresholdInput = await vscode.window.showInputBox({
            placeHolder: "Soglia di similarità (opzionale, default: 0.7)",
            prompt: "Inserisci un numero tra 0 e 1 per la ricerca fuzzy"
        });
        
        // Crea la chiamata tool
        const searchArgs: any = {
            tags: searchTags
        };
        
        if (searchScope && searchScope !== "Tutti gli scope") {
            searchArgs.scope = searchScope;
        }
        
        if (searchLimitInput && !isNaN(parseInt(searchLimitInput))) {
            searchArgs.limit = parseInt(searchLimitInput);
        }
        
        if (similarityThresholdInput && !isNaN(parseFloat(similarityThresholdInput))) {
            const threshold = parseFloat(similarityThresholdInput);
            if (threshold >= 0 && threshold <= 1) {
                searchArgs.similarityThreshold = threshold;
            }
        }
        
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: "context.searchByTags",
            args: searchArgs
        };
        
        let searchMessage = `Invio richiesta per ricerca contesti con tag: ${searchTags.join(", ")}`;
        if (searchScope && searchScope !== "Tutti gli scope") searchMessage += ` in scope '${searchScope}'`;
        if (searchLimitInput) searchMessage += ` (limite: ${searchLimitInput})`;
        if (similarityThresholdInput) searchMessage += ` (similarità: ${similarityThresholdInput})`;
        
        vscode.window.showInformationMessage(searchMessage);
    } else if (tool === 'project.summary') {
        // Chiedi la profondità di scansione
        const depth = await vscode.window.showQuickPick(
            ['1', '2', '3', '4', '5'],
            { placeHolder: 'Profondità di scansione', canPickMany: false }
        );

        if (!depth) {
            vscode.window.showInformationMessage('Test annullato.');
            return;
        }

        // Chiedi se includere analisi dei file
        const includeFiles = await vscode.window.showQuickPick(
            ['Sì', 'No'],
            { placeHolder: 'Includere analisi dei file chiave?', canPickMany: false }
        );

        // Crea una chiamata tool per project.summary
        toolCall = {
            requestId: `test-${Date.now()}`,
            tool: 'project.summary',
            args: {
                depth: parseInt(depth),
                includeFiles: includeFiles === 'Sì'
            }
        };

        const filesInfo = includeFiles === 'No' ? ' senza analisi file' : '';
        vscode.window.showInformationMessage(`Invio richiesta per riepilogo progetto (profondità: ${depth})${filesInfo}`);
    } else {
        vscode.window.showErrorMessage(`Tool non supportato: ${tool}`);
        return;
    }

    // Se è stata configurata una chiamata tool, eseguila tramite il dispatcher
    if (toolCall) {
        try {
            await dispatcher.handleToolCall(toolCall);
        } catch (error) {
            vscode.window.showErrorMessage(`Errore nell'esecuzione del tool: ${error}`);
        }
    }
}

// Funzione di registrazione comando
export function registerTestCommand(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('jarvis.testMcpDispatcher', testMcpDispatcher);
    context.subscriptions.push(disposable);
} 