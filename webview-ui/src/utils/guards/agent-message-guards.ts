export function isAgentErrorMessage(message: unknown): message is {
  type: 'agentError';
  payload: { agentId: string; error: string };
} {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as any).type === 'agentError' &&
    typeof (msg.payload as unknown)?.agentId === 'string'
  );
} 