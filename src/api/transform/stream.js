/**
 * Definizioni di tipi e utility per il flusso di risposte AI.
 * Versione JavaScript per i test.
 */

// Funzione per creare uno stream parser da una Response ReadableStream.
function createStreamParser(stream) {
  const decoder = new TextDecoder("utf-8");
  const reader = stream.getReader();

  let cancelled = false;
  let buffer = "";

  const iterator = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          while (!cancelled) {
            try {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");

              // Salviamo l'ultima riga incompleta per il prossimo chunk
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith("data:")) continue;

                const raw = trimmedLine.replace(/^data:\s*/, "");
                if (raw === "[DONE]") return { done: true, value: undefined };

                try {
                  const json = JSON.parse(raw);
                  return { done: false, value: json };
                } catch (parseError) {
                  console.warn("[stream] Errore parsing JSON:", parseError);
                  continue; // ignoriamo e attendiamo il prossimo chunk valido
                }
              }
            } catch (err) {
              console.error("[stream] Errore lettura dallo stream:", err);
              break;
            }
          }
          return { done: true, value: undefined };
        },
      };
    },
  };

  // Funzione per annullare manualmente lo stream
  iterator.cancel = () => {
    cancelled = true;
    reader.cancel().catch(() => {}); // Ignoriamo eventuali errori di cancellazione
  };

  return iterator;
}

// Crea un ApiStream dal risultato di una chiamata API che restituisce un ReadableStream.
function createApiStream(response) {
  const stream = response.body;
  if (!stream) {
    throw new Error("[stream] Response non contiene un body leggibile");
  }
  return createStreamParser(stream);
}

// Utility per creare uno stream simulato da una serie di eventi.
function createMockStream(chunks, delayMs = 0) {
  let cancelled = false;
  let index = 0;

  const iterator = {
    [Symbol.asyncIterator]() {
      return {
        async next() {
          if (cancelled || index >= chunks.length) {
            return { done: true, value: undefined };
          }

          if (delayMs > 0) {
            await new Promise(resolve => setTimeout(resolve, delayMs));
          }

          return { done: false, value: chunks[index++] };
        },
      };
    },
  };

  // Funzione per annullare manualmente lo stream
  iterator.cancel = () => {
    cancelled = true;
  };

  return iterator;
}

module.exports = {
  createStreamParser,
  createApiStream,
  createMockStream
}; 