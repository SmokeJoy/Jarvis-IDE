import { OpenAiCompatibleModelInfo } from '../../types/extension';

export const loadModels = async (): Promise<OpenAiCompatibleModelInfo[]> => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load models');
    }
    
    const data = await response.json();
    return data.data.map((model: any) => ({
      id: model.id,
      name: model.name,
      context_length: model.context_length,
      temperature: 0.7,
      maxTokens: 1000,
      contextWindow: model.context_length,
      description: model.description || '',
      provider: 'openai',
      inputPrice: 0.001,
      outputPrice: 0.002,
      supportsPromptCache: true,
      supportsFunctionCalling: true,
      supportsVision: false
    }));
  } catch (error) {
    console.error('Error loading models:', error);
    return [];
  }
}; 