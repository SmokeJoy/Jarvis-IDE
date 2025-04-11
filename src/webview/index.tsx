import React from "react";
import { createRoot } from "react-dom/client";
import { Webview } from "./webview.js";
import { ApiConfiguration } from "../types/global.js";
import { ChatMessage } from "../shared/types.js";
import { ExtensionMessage } from "../shared/ExtensionMessage.js";

declare global {
  interface Window {
    initialConfig: ApiConfiguration;
  }
}

const root = createRoot(document.getElementById("root")!);
root.render(<Webview config={window.initialConfig} />); 