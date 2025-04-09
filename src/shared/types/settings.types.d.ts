import type { ApiConfiguration } from './api.types.js.js';
import type { TelemetrySetting } from './telemetry.types.js.js';
/**
 * Rappresenta un modello LLM disponibile
 */
export interface AvailableModel {
    label: string;
    value: string;
    provider: string;
    coder: boolean;
    apiKey?: string;
    endpoint?: string;
}
export interface Settings {
    apiConfiguration: ApiConfiguration;
    telemetrySetting: TelemetrySetting;
    customInstructions: string;
    planActSeparateModelsSetting: boolean;
    use_docs: boolean;
    coder_mode: boolean;
    multi_agent: boolean;
    contextPrompt: string;
    selectedModel?: string;
    systemPromptPath?: string;
    availableModels?: AvailableModel[];
    code_style?: 'standard' | 'concise' | 'verbose';
}
//# sourceMappingURL=settings.types.d.ts.map