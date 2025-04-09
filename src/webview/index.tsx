import React from "react";
import { createRoot } from "react-dom/client";
import { Webview } from "./webview.js.js";
import type { ApiConfiguration } from "../types/global.js.js";
import type { ChatMessage } from "../shared/types.js.js";
import type { ExtensionMessage } from "../shared/ExtensionMessage.js.js";

declare global {
  interface Window {
    initialConfig: ApiConfiguration;
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(<Webview config={window.initialConfig} />); 