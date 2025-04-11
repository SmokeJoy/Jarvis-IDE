# Architettura dell'Orchestratore Multi-Agente

## Introduzione

L'orchestratore Multi-Agente (MASOrchestrator) è il componente centrale del sistema che coordina l'esecuzione di diversi agenti specializzati per portare a termine task complessi. Questo documento descrive l'architettura di alto livello dell'orchestratore, i suoi componenti principali e i pattern di interazione.

## Componenti Principali

L'orchestratore è composto dai seguenti elementi:

1. **Agenti**: entità specializzate che eseguono compiti specifici (es. pianificazione, ricerca, analisi)
2. **Manager degli Agenti**: gestisce la registrazione e il recupero degli agenti 
3. **Manager della Memoria**: gestisce lo stato condiviso tra gli agenti
4. **Gestore del Flusso**: coordina l'esecuzione sequenziale o parallela degli agenti
5. **Sistema di Fallback**: gestisce gli errori e garantisce la resilienza dell'esecuzione
6. **Gestore dei Provider LLM**: gestisce l'accesso ai modelli linguistici di terze parti

## Flusso di Esecuzione

Il flusso di esecuzione tipico è il seguente:

1. L'utente invia una query all'orchestratore
2. L'orchestratore inizializza il contesto e attiva l'agente iniziale (di default, il "planner")
3. Ogni agente esegue il proprio compito specializzato e aggiorna il contesto condiviso
4. Al termine dell'esecuzione, ogni agente può specificare quale agente deve essere eseguito successivamente
5. L'orchestratore continua a eseguire gli agenti nella sequenza specificata fino a raggiungere un agente terminale o il limite massimo di turni
6. Il risultato finale viene restituito all'utente

## Gestione degli Errori e Resilienza

L'orchestratore implementa diversi meccanismi per gestire gli errori e garantire la resilienza:

1. **Rilevamento dei cicli**: identifica e interrompe cicli di esecuzione tra agenti
2. **Limite di turni**: previene esecuzioni infinite imponendo un numero massimo di turni
3. **Agente di fallback**: in caso di errore in un agente, può essere attivato un agente di fallback specificato
4. **Ripristino del contesto**: in caso di errore, il contesto viene preservato per consentire la ripresa dell'esecuzione

## Monitoraggio in tempo reale e metriche

L'orchestratore include un sistema di monitoraggio in tempo reale che permette di osservare e reagire agli eventi durante l'esecuzione. Questo è implementato attraverso un pattern Observer che notifica eventi chiave del sistema.

### Eventi disponibili

Il sistema di monitoraggio espone i seguenti eventi principali:

- `provider:success`: emesso quando un provider LLM completa con successo una richiesta
- `provider:failure`: emesso quando un provider LLM fallisce nell'elaborare una richiesta
- `provider:fallback`: emesso quando il sistema passa a un provider alternativo dopo un fallimento
- `provider:statsUpdated`: emesso quando vengono aggiornate le statistiche di un provider

Ogni evento include un payload standardizzato con almeno:
- `providerId`: identificativo del provider coinvolto
- `timestamp`: data e ora dell'evento in millisecondi
- dati aggiuntivi specifici per il tipo di evento

### Come utilizzare il sistema di monitoraggio

È possibile registrare listener per reagire agli eventi in tempo reale. Ecco un esempio di utilizzo:

```typescript
// Ottieni l'event bus dall'orchestratore
const eventBus = orchestrator.fallbackManager.getEventBus();

// Registra un listener per monitorare i successi
eventBus.on('provider:success', (payload) => {
  console.log(`Provider ${payload.providerId} ha risposto in ${payload.responseTime}ms`);
  
  // Aggiorna metriche in tempo reale
  updateDashboard({
    provider: payload.providerId,
    responseTime: payload.responseTime,
    success: true
  });
});

// Registra un listener per monitorare i fallimenti
eventBus.on('provider:failure', (payload) => {
  console.error(`Provider ${payload.providerId} ha fallito:`, payload.error.message);
  
  // Incrementa contatori di errore
  incrementErrorCounter(payload.providerId);
});

// Registra un listener per monitorare i fallback
eventBus.on('provider:fallback', (payload) => {
  console.warn(`Fallback da ${payload.fromProviderId} a ${payload.providerId}`);
  
  // Registra l'evento di fallback per analisi
  logFallbackEvent(payload);
});
```

### Implementazione di dashboard di monitoraggio

Il sistema di eventi può essere facilmente integrato con strumenti di visualizzazione per creare dashboard di monitoraggio in tempo reale che mostrano:

1. **Disponibilità dei provider** - Stato di salute di ciascun provider LLM
2. **Tempi di risposta** - Latenza media delle richieste per provider
3. **Tassi di successo** - Percentuale di richieste completate con successo
4. **Fallback** - Frequenza e pattern di fallback tra provider
5. **Utilizzo** - Volume di richieste per provider nel tempo

### Estensibilità

Il sistema di eventi è progettato per essere estensibile. È possibile:

- Aggiungere nuovi tipi di eventi secondo necessità
- Filtrare o aggregare eventi per analisi avanzate
- Integrare con sistemi di logging esterni o servizi di monitoraggio
- Implementare meccanismi di throttling o rate limiting basati sui pattern osservati

Per implementare un sistema di monitoraggio personalizzato, è sufficiente estendere la classe `LLMEventBus` o fornire un'implementazione personalizzata che rispetti l'interfaccia di base.

## Fallback dei Provider LLM

### Come Funziona il Sistema di Fallback

Il sistema di fallback dei provider LLM è progettato per garantire alta disponibilità e resilienza nelle interazioni con i modelli linguistici esterni. Ecco come funziona in linguaggio semplice:

1. **Selezione del Provider**: il sistema tenta prima di utilizzare il provider preferito
2. **Gestione degli Errori**: se il provider preferito fallisce, il sistema passa automaticamente al provider successivo
3. **Memorizzazione del Successo**: il sistema tiene traccia dell'ultimo provider che ha avuto successo e lo utilizza come preferito per le future richieste
4. **Resilienza**: se un provider diventa nuovamente disponibile dopo un errore, il sistema può tornare a utilizzarlo

### Cooldown dei Provider

Il sistema implementa un meccanismo di cooldown per evitare di sovraccaricare i provider che stanno avendo problemi. Quando un provider fallisce, viene messo in "pausa" per un periodo configurabile prima di essere ritentato. Questo aiuta a:

- Ridurre la latenza evitando tentativi su provider problematici
- Dare tempo al provider di ripristinarsi
- Distribuire il carico su provider alternativi

### Strategie di Fallback

Il sistema di fallback supporta diverse strategie per la selezione dei provider, implementando il pattern Strategy. Questo permette di personalizzare la logica di selezione in base alle esigenze specifiche dell'applicazione.

#### Strategie Disponibili

1. **PreferredFallbackStrategy**: La strategia predefinita che seleziona prima il provider preferito e poi gli altri in ordine. Può anche memorizzare l'ultimo provider che ha avuto successo per usarlo come preferito nelle richieste successive.

   ```typescript
   // Esempio di utilizzo
   const fallbackManager = new LLMFallbackManager({
     providers: [...],
     strategy: new PreferredFallbackStrategy('openai', true)
   });
   ```

2. **RoundRobinFallbackStrategy**: Distribuisce le richieste tra i provider in modo ciclico, utile per bilanciare il carico.

   ```typescript
   // Esempio di utilizzo
   const fallbackManager = new LLMFallbackManager({
     providers: [...],
     strategy: new RoundRobinFallbackStrategy()
   });
   ```

3. **ReliabilityFallbackStrategy**: Seleziona i provider in base alla loro affidabilità storica (tasso di successo), preferendo quelli con le migliori performance.

   ```typescript
   // Esempio di utilizzo
   const fallbackManager = new LLMFallbackManager({
     providers: [...],
     strategy: new ReliabilityFallbackStrategy(5) // Minimo 5 tentativi per considerare affidabile
   });
   ```

#### Implementare Strategie Personalizzate

È possibile creare strategie personalizzate implementando l'interfaccia `FallbackStrategy`:

```typescript
import { FallbackStrategy } from './strategies/FallbackStrategy';

class CustomStrategy implements FallbackStrategy {
  selectProvider(providers, stats, failedProviders) {
    // Logica personalizzata di selezione
  }
  
  getProvidersInOrder(providers, stats, failedProviders) {
    // Ordinamento personalizzato dei provider
  }
  
  notifySuccess(providerId) {
    // Azioni da eseguire in caso di successo
  }
  
  notifyFailure(providerId) {
    // Azioni da eseguire in caso di fallimento
  }
}
```

#### Cambiare Strategia a Runtime

È possibile cambiare la strategia di fallback durante l'esecuzione:

```typescript
// Passa a una strategia round robin quando necessario
fallbackManager.setStrategy(new RoundRobinFallbackStrategy());

// Passa a una strategia basata sull'affidabilità
fallbackManager.setStrategy(new ReliabilityFallbackStrategy());
```

## Esecuzione Parallela

L'orchestratore supporta anche l'esecuzione parallela di agenti, utile per task indipendenti che possono essere eseguiti contemporaneamente:

1. Si definisce un batch di task paralleli, ciascuno associato a un agente
2. L'orchestratore esegue i task in batch paralleli, rispettando il limite massimo di agenti concorrenti
3. I risultati vengono raccolti e restituiti in forma aggregata

## Considerazioni sulle Prestazioni

L'orchestratore è progettato per bilanciare efficienza e affidabilità:

1. **Gestione della Memoria**: Il contesto viene aggiornato in modo incrementale, preservando solo le informazioni necessarie
2. **Esecuzione Ottimizzata**: Gli agenti vengono eseguiti solo quando necessario, evitando operazioni ridondanti
3. **Profiling delle Prestazioni**: È possibile monitorare il tempo di esecuzione di ogni agente per identificare colli di bottiglia 