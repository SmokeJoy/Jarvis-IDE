import { JarvisMessage } from './ExtensionMessage';

/**
 * Rappresenta le metriche di utilizzo dell'API
 */
export interface ApiMetrics {
  totalCost: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

/**
 * Calculates API metrics from an array of JarvisMessages.
 * Analyzes "api_req_started" and "api_req_finished" message pairs to
 * calculate total cost and token usage.
 *
 * @param messages - An array of JarvisMessage objects to process.
 * @returns An ApiMetrics object with totals.
 */
export function getApiMetrics(messages: JarvisMessage[]): ApiMetrics {
  const result: ApiMetrics = {
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
  };

  messages.forEach((message) => {
    if (
      message.type === 'say' &&
      (message.say === 'api_req_started' || message.say === 'deleted_api_reqs') &&
      message.text
    ) {
      try {
        const parsedData = JSON.parse(message.text);
        const { tokensIn, tokensOut, cost } = parsedData;

        if (typeof tokensIn === 'number') {
          result.totalTokensIn += tokensIn;
        }
        if (typeof tokensOut === 'number') {
          result.totalTokensOut += tokensOut;
        }
        if (typeof cost === 'number') {
          result.totalCost += cost;
        }
      } catch (error) {
        console.error('Error parsing JSON:', error);
      }
    }
  });

  return result;
}
