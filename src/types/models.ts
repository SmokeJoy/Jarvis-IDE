export interface ConfigModelInfo {
  value: string;
  label: string;
  description: string;
  maxTokens: number;
  contextWindow: number;
  pricePer1kTokens: number;
  provider: string;
  capabilities: string[];
  isDefault?: boolean;
}
