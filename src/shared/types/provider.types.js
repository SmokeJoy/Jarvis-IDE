// Importazioni necessarie
import * as vscode from "vscode";
import { ChatSettings, AutoApprovalSettings, BrowserSettings } from "./user-settings.types";
import { ApiConfiguration, OpenAiCompatibleModelInfo, LLMProviderId } from "./api.types";
import { AgentStatus, PriorityLevel, TaskQueueState } from "./mas.types";
import { ChatContent } from "../ChatContent";
import { WebviewMessage } from "./webview.types";
/**
 * Stati possibili dell'agente
 */
export var AgentMode;
(function (AgentMode) {
    AgentMode["INACTIVE"] = "inactive";
    AgentMode["ACTIVE"] = "active";
    AgentMode["BUSY"] = "busy";
    AgentMode["ERROR"] = "error";
})(AgentMode || (AgentMode = {}));
//# sourceMappingURL=provider.types.js.map