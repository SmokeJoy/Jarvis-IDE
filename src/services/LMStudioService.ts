// 📁 File: src/services/LMStudioService.ts

// Questa funzione permette di inviare un prompt testuale al server LM Studio
// che esegue localmente il modello DeepSeek-Coder (via http://192.168.1.9:1234)
// e restituisce la risposta generata dall'AI.

// La funzione è asincrona: attende il completamento della richiesta HTTP
import { getLLMModel } from "../config/configManager.js";
import { shouldUseDocs } from "../config/configManager.js";
import { loadDocsFromFolder } from "../utils/docLoader.js";

export async function sendPrompt(prompt: string): Promise<string> {
  try {
    // 🌐 Eseguiamo una chiamata POST verso l'API di completamento di LM Studio
    const response = await fetch('http://192.168.1.9:1234/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json' // Formato JSON per il body
      },
      body: JSON.stringify({
        model: getLLMModel(),             // ✅ Nome del modello letto da config.json
        prompt: shouldUseDocs() ? loadDocsFromFolder() + '\n\n' + prompt : prompt, // 🧠 Prompt con/senza documentazione
        temperature: 0.2,                 // 🔁 Bassa creatività, alta precisione
        max_tokens: 2048,                 // 📏 Massimo output generato
        stop: ["<|endoftext|>"]           // ⛔️ Token di arresto opzionale
      })
    });

    // 📥 Decodifichiamo la risposta JSON ricevuta dal server LLM
    const data = await response.json();

    // ✅ Se la risposta contiene almeno una "choice", restituiamo il testo generato
    return data.choices?.[0]?.text || "⚠️ Nessuna risposta generata dal modello.";
  } catch (error) {
    // ❌ Se qualcosa va storto (es. LLM spento o rete assente), mostriamo un errore
    console.error("❌ Errore nella comunicazione con LM Studio:", error);
    return "❌ Errore: impossibile contattare il modello AI locale.";
  }
} 