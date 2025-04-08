import * as fs from "fs";
import * as path from "path";

const configPath = path.resolve(__dirname, "../../../config/config.json");

export function getConfig() {
  if (!fs.existsSync(configPath)) return {};
  const raw = fs.readFileSync(configPath, "utf-8");
  return JSON.parse(raw);
}

export function getLLMModel() {
  const cfg = getConfig();
  return cfg.llm_model || "deepseek-coder:6.7b-kexer";
}

export function shouldUseDocs() {
  const cfg = getConfig();
  return cfg.use_project_docs === true;
} 