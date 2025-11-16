import { sanitizeInput } from '../../utils/sanitize';
import { getPrompt } from '../promptTemplates';

// Base AI Client
class AIClient {
  constructor(apiKey, provider) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  async makeRequest(endpoint, options) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`AI API Error (${this.provider}):`, error);
      throw new Error(`Failed to connect to ${this.provider} API: ${error.message}`);
    }
  }

  formatPrompt(prompt, toolType) {
    return getPrompt(toolType, prompt);
  }
}

// OpenAI Implementation
export class OpenAIClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'openai');
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'gpt-3.5-turbo') {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: formattedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    return response.choices[0].message.content;
  }
}

// Anthropic Implementation
export class AnthropicClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'anthropic');
    this.endpoint = 'https://api.anthropic.com/v1/messages';
  }

  async generate(prompt, toolType, model = 'claude-3-sonnet-20240229') {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [
          {
            role: 'user',
            content: formattedPrompt
          }
        ]
      })
    });

    return response.content[0].text;
  }
}

// Google AI Implementation
export class GoogleAIClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'google');
    this.endpoint = `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`;
  }

  async generate(prompt, toolType) {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: formattedPrompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        }
      })
    });

    return response.candidates[0].content.parts[0].text;
  }
}

// Groq Implementation
export class GroqClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'groq');
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'llama2-70b-4096') {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: formattedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    return response.choices[0].message.content;
  }
}

// DeepSeek Implementation
export class DeepSeekClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'deepseek');
    this.endpoint = 'https://api.deepseek.com/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'deepseek-chat') {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: formattedPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    return response.choices[0].message.content;
  }
}

// HuggingFace Implementation (simplified)
export class HuggingFaceClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'huggingface');
    this.endpoint = 'https://api-inference.huggingface.co/models/microsoft/DialoGPT-large';
  }

  async generate(prompt, toolType) {
    const formattedPrompt = this.formatPrompt(sanitizeInput(prompt), toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7
        }
      })
    });

    return response[0]?.generated_text || 'Response not available';
  }
}

// Factory function to create AI clients
export function createAIClient(provider, apiKey) {
  const clients = {
    openai: OpenAIClient,
    anthropic: AnthropicClient,
    google: GoogleAIClient,
    groq: GroqClient,
    deepseek: DeepSeekClient,
    huggingface: HuggingFaceClient
  };

  const ClientClass = clients[provider];
  if (!ClientClass) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  return new ClientClass(apiKey);
}

// Unified AI Service
export class AIService {
  constructor() {
    this.clients = new Map();
  }

  setClient(provider, apiKey) {
    try {
      const client = createAIClient(provider, apiKey);
      this.clients.set(provider, client);
      return true;
    } catch (error) {
      console.error(`Failed to create AI client for ${provider}:`, error);
      return false;
    }
  }

  async generate(provider, prompt, toolType, model) {
    const client = this.clients.get(provider);
    if (!client) {
      throw new Error(`No client configured for provider: ${provider}. Please check your API key.`);
    }

    try {
      const response = await client.generate(prompt, toolType, model);
      
      // Try to parse JSON responses
      try {
        return JSON.parse(response);
      } catch {
        return response;
      }
    } catch (error) {
      console.error(`AI generation failed for ${provider}:`, error);
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  hasClient(provider) {
    return this.clients.has(provider);
  }
}

export const aiService = new AIService();