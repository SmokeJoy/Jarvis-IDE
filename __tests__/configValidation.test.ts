import { validateApiConfiguration } from "../src/utils/validateApiConfiguration"
import { ApiConfiguration } from "../src/shared/types/api.types"

describe("validateApiConfiguration", () => {
  it("dovrebbe restituire errore se il provider non è selezionato", () => {
    const config: Partial<ApiConfiguration> = {}
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("Provider non selezionato.")
  })

  it("dovrebbe validare correttamente la configurazione OpenRouter", () => {
    const config: Partial<ApiConfiguration> = {
      provider: "openrouter"
    }
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("OpenRouter API Key mancante.")
    expect(errors).toContain("Model ID non impostato.")
    expect(errors).toContain("Informazioni del modello mancanti.")

    const validConfig: Partial<ApiConfiguration> = {
      provider: "openrouter",
      openAiApiKey: "test-key",
      modelId: "test-model",
      openAiModelInfo: {
        id: "test-model",
        name: "Test Model",
        context_length: 1000,
        temperature: 0.7,
        supportsStreaming: true
      }
    }
    const validErrors = validateApiConfiguration(validConfig as ApiConfiguration)
    expect(validErrors).toHaveLength(0)
  })

  it("dovrebbe validare correttamente la configurazione Anthropic", () => {
    const config: Partial<ApiConfiguration> = {
      provider: "anthropic"
    }
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("Anthropic API Key mancante.")
    expect(errors).toContain("Model ID non impostato.")

    const validConfig: Partial<ApiConfiguration> = {
      provider: "anthropic",
      anthropicApiKey: "test-key",
      modelId: "test-model"
    }
    const validErrors = validateApiConfiguration(validConfig as ApiConfiguration)
    expect(validErrors).toHaveLength(0)
  })

  it("dovrebbe validare correttamente la configurazione AWS Bedrock", () => {
    const config: Partial<ApiConfiguration> = {
      provider: "bedrock"
    }
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("AWS Access Key ID mancante.")
    expect(errors).toContain("AWS Secret Access Key mancante.")
    expect(errors).toContain("AWS Region mancante.")
    expect(errors).toContain("Model ID non impostato.")

    const validConfig: Partial<ApiConfiguration> = {
      provider: "bedrock",
      awsAccessKeyId: "test-key",
      awsSecretAccessKey: "test-secret",
      awsRegion: "us-east-1",
      modelId: "test-model"
    }
    const validErrors = validateApiConfiguration(validConfig as ApiConfiguration)
    expect(validErrors).toHaveLength(0)
  })

  it("dovrebbe validare correttamente la configurazione Azure", () => {
    const config: Partial<ApiConfiguration> = {
      provider: "azure"
    }
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("Azure API Key mancante.")
    expect(errors).toContain("Azure Deployment Name mancante.")
    expect(errors).toContain("Azure Endpoint mancante.")
    expect(errors).toContain("Azure API Version mancante.")

    const validConfig: Partial<ApiConfiguration> = {
      provider: "azure",
      azureApiKey: "test-key",
      azureDeploymentName: "test-deployment",
      azureEndpoint: "test-endpoint",
      azureApiVersion: "2023-05-15"
    }
    const validErrors = validateApiConfiguration(validConfig as ApiConfiguration)
    expect(validErrors).toHaveLength(0)
  })

  it("dovrebbe validare correttamente la configurazione Ollama", () => {
    const config: Partial<ApiConfiguration> = {
      provider: "ollama"
    }
    const errors = validateApiConfiguration(config as ApiConfiguration)
    expect(errors).toContain("Ollama Base URL mancante.")
    expect(errors).toContain("Model ID non impostato.")

    const validConfig: Partial<ApiConfiguration> = {
      provider: "ollama",
      ollamaBaseUrl: "http://localhost:11434",
      modelId: "test-model"
    }
    const validErrors = validateApiConfiguration(validConfig as ApiConfiguration)
    expect(validErrors).toHaveLength(0)
  })
}) 