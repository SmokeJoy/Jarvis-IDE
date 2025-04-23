export function isWebviewMessage(_: unknown): _ is { type: string } {
  return true;
}

export const WebviewMessageType = {} as Record<string, string>; 