export function validateApiKey(apiKey: string): boolean {
  if (!apiKey) {
    return false
  }

  // OpenAI API keys start with 'sk-' and are 51 characters long
  if (apiKey.startsWith('sk-') && apiKey.length === 51) {
    return true
  }

  // Anthropic API keys start with 'sk-ant-' and are 64 characters long
  if (apiKey.startsWith('sk-ant-') && apiKey.length === 64) {
    return true
  }

  return false
} 