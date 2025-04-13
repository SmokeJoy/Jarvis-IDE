/**
 * @file perf.ts
 * @description Utility per il profiling delle prestazioni nei test
 */

/**
 * Misura il tempo di esecuzione di una funzione asincrona
 * @param fn Funzione da misurare
 * @returns Oggetto con il risultato della funzione e la durata di esecuzione in ms
 */
export function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  return fn().then((result) => ({
    result,
    duration: performance.now() - start,
  }));
}

/**
 * Misura l'utilizzo corrente della memoria
 * @returns Memoria utilizzata in bytes
 */
export function getMemoryUsage(): number {
  return process.memoryUsage().heapUsed;
}

/**
 * Calcola la differenza percentuale tra due misurazioni di memoria
 * @param before Misurazione iniziale
 * @param after Misurazione finale
 * @returns Percentuale di crescita della memoria
 */
export function getMemoryGrowthPercentage(before: number, after: number): number {
  return ((after - before) / before) * 100;
}
