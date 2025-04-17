import type { WebviewMessageUnion } from "./webviewMessageUnion";

export function isWebviewMessage(msg: unknown): msg is WebviewMessageUnion {
  return typeof msg === "object" && msg !== null && "type" in msg;
}