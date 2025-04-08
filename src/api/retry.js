/**
 * Riprova una funzione asincrona più volte in caso di errore.
 * Utile per richieste HTTP fallibili (es. API rate limitate).
 */
export async function retryAsync(fn, retries = 2, delay = 500) {
	let attempt = 0;
	while (attempt <= retries) {
		try {
			return await fn();
		} catch (error) {
			attempt++;
			if (attempt > retries) {
				console.error(`[retryAsync] Errore definitivo dopo ${retries} tentativi:`, error);
				throw error;
			}
			console.warn(`[retryAsync] Tentativo ${attempt} fallito, nuovo tentativo tra ${delay}ms...`);
			await new Promise((res) => setTimeout(res, delay));
		}
	}
	throw new Error('Impossibile completare la richiesta dopo i retry.');
} 