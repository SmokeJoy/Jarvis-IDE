# Jarvis IDE API

L'estensione Jarvis IDE espone un'API che può essere utilizzata da altre estensioni. Per utilizzare questa API nella tua estensione:

1. Copia `src/extension-api/jarvis-ide.d.ts` nella directory sorgente della tua estensione.
2. Includi `jarvis-ide.d.ts` nella compilazione della tua estensione.
3. Accedi all'API con il seguente codice:

    ```ts
    const jarvisExtension = vscode.extensions.getExtension<JarvisIdeAPI>("saoudrizwan.claude-dev")

    if (!jarvisExtension?.isActive) {
    	throw new Error("Jarvis IDE extension is not activated")
    }

    const jarvis = jarvisExtension.exports

    if (jarvis) {
    	// Ora puoi utilizzare l'API

    	// Imposta istruzioni personalizzate
    	await jarvis.setCustomInstructions("Parla come un pirata")

    	// Ottieni istruzioni personalizzate
    	const instructions = await jarvis.getCustomInstructions()
    	console.log("Istruzioni personalizzate attuali:", instructions)

    	// Inizia una nuova attività con un messaggio iniziale
    	await jarvis.startNewTask("Ciao, Jarvis! Creiamo un nuovo progetto...")

    	// Inizia una nuova attività con un messaggio iniziale e immagini
    	await jarvis.startNewTask("Usa questo linguaggio di design", ["data:image/webp;base64,..."])

    	// Invia un messaggio all'attività corrente
    	await jarvis.sendMessage("Puoi correggere i @problemi?")

    	// Simula la pressione del pulsante principale nell'interfaccia di chat (es. 'Salva' o 'Procedi mentre esegui')
    	await jarvis.pressPrimaryButton()

    	// Simula la pressione del pulsante secondario nell'interfaccia di chat (es. 'Rifiuta')
    	await jarvis.pressSecondaryButton()
    } else {
    	console.error("Jarvis IDE API non è disponibile")
    }
    ```

    **Nota:** Per assicurarti che l'estensione `saoudrizwan.claude-dev` sia attivata prima della tua estensione, aggiungila alle `extensionDependencies` nel tuo `package.json`:

    ```json
    "extensionDependencies": [
        "saoudrizwan.claude-dev"
    ]
    ```

Per informazioni dettagliate sui metodi disponibili e sul loro utilizzo, consulta il file `jarvis-ide.d.ts`.
