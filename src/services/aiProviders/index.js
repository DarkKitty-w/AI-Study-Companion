// ### FIX: Removed sanitizeInput import as it's no longer used ###
import { getPrompt } from '../promptTemplates';

// Base AI Client
class AIClient {
  constructor(apiKey, provider) {
    this.apiKey = apiKey;
    this.provider = provider;
  }

  // Added retry logic for 503/429 errors
  async makeRequest(endpoint, options, retries = 3) {
    let lastError;

    for (let i = 0; i < retries; i++) {
      try {
        const { headers: customHeaders, ...restOptions } = options;
        const response = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            ...customHeaders,
          },
          ...restOptions,
        });

        if (!response.ok) {
          // Check for retryable server errors (503 = Overloaded, 429 = Rate Limit)
          if (response.status === 503 || response.status === 429) {
            const delay = (2 ** i) * 1000 + Math.random() * 1000; // Exponential backoff
            console.warn(`AI API Error (${this.provider}): Status ${response.status}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${i + 1}/${retries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            lastError = new Error(`API request failed: ${response.status} ${response.statusText}`);
            continue; // Go to the next loop iteration (retry)
          }

          // Non-retryable client/server error (e.g., 400, 401, 404)
          const errorBody = await response.json().catch(() => ({}));
          const errorDetails = errorBody.error?.message || response.statusText;
          lastError = new Error(`API request failed: ${response.status} ${errorDetails}`);
          throw lastError; // Throw, will be caught by outer catch
        }

        return await response.json(); // Success!

      } catch (error) {
        lastError = error; // Store the error
        
        if (error.message.startsWith('API request failed')) {
          console.error(`AI API Error (${this.provider}):`, error);
          throw error; // Rethrow non-retryable error
        }
        
        const delay = (2 ** i) * 1000 + Math.random() * 1000;
        console.warn(`AI API Network Error (${this.provider}): ${error.message}. Retrying in ${delay.toFixed(0)}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    console.error(`AI API Error (${this.provider}): All retries failed.`, lastError);
    throw new Error(`Failed to connect to ${this.provider} API after ${retries} attempts: ${lastError.message}`);
  }


  formatPrompt(prompt, toolType) {
    return getPrompt(toolType, prompt);
  }
}

// ### Helper for OpenAI-compatible clients ###
function handleOpenAIResponse(response, provider) {
  if (!response.choices || response.choices.length === 0) {
    console.error(`Invalid ${provider} response:`, response);
    throw new Error(`${provider} AI returned an empty or invalid response.`);
  }
  return response.choices[0].message.content;
}

// OpenAI Implementation
export class OpenAIClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'openai');
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'gpt-3.5-turbo') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: formattedPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    return handleOpenAIResponse(response, this.provider);
  }
}

// Anthropic Implementation
export class AnthropicClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'anthropic');
    this.endpoint = 'https://api.anthropic.com/v1/messages';
  }

  async generate(prompt, toolType, model = 'claude-3-sonnet-20240229') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: formattedPrompt }]
      })
    });

    if (!response.content || response.content.length === 0) {
      console.error('Invalid Anthropic response:', response);
      throw new Error('Anthropic AI returned an empty or invalid response.');
    }
    return response.content[0].text;
  }
}

// Google AI Implementation
export class GoogleAIClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'google');
    this.baseEndpoint = 'https://generativelanguage.googleapis.com/v1/models';
  }

  async generate(prompt, toolType, model = 'gemini-2.5-flash') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    const endpoint = `${this.baseEndpoint}/${model}:generateContent?key=${this.apiKey}`;
    
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        contents: [{ parts: [{ text: formattedPrompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 20000,
        }
      })
    });

    if (!response.candidates || response.candidates.length === 0) {
      if (response.promptFeedback && response.promptFeedback.blockReason) {
        throw new Error(`Google AI request blocked for: ${response.promptFeedback.blockReason}`);
      }
      console.error('Invalid Google AI response (no candidates):', response);
      throw new Error('Google AI returned an invalid or empty response.');
    }

    const candidate = response.candidates[0];

    if (candidate.finishReason !== 'STOP') {
      throw new Error(`Google AI stopped with reason: ${candidate.finishReason}. No content generated.`);
    }

    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Invalid Google AI candidate (no content):', candidate);
      throw new Error('Google AI returned a candidate with no content.');
    }

    return candidate.content.parts[0].text;
  }
}

// Groq Implementation
export class GroqClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'groq');
    this.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'llama2-70b-4096') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: formattedPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    return handleOpenAIResponse(response, this.provider);
  }
}

// DeepSeek Implementation
export class DeepSeekClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'deepseek');
    this.endpoint = 'https://api.deepseek.com/v1/chat/completions';
  }

  async generate(prompt, toolType, model = 'deepseek-chat') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    
    const response = await this.makeRequest(this.endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: formattedPrompt }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    return handleOpenAIResponse(response, this.provider);
  }
}

// HuggingFace Implementation (simplified)
export class HuggingFaceClient extends AIClient {
  constructor(apiKey) {
    super(apiKey, 'huggingface');
    this.baseEndpoint = 'https://api-inference.huggingface.co/models';
  }

  async generate(prompt, toolType, model = 'microsoft/DialoGPT-large') {
    // ### FIX: Removed sanitizeInput ###
    const formattedPrompt = this.formatPrompt(prompt, toolType);
    const endpoint = `${this.baseEndpoint}/${model}`;
    
    const response = await this.makeRequest(endpoint, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        inputs: formattedPrompt,
        parameters: {
          max_length: 1000,
          temperature: 0.7
        }
      })
    });

    if (Array.isArray(response) && response[0]?.generated_text) {
      return response[0].generated_text;
    }
    
    if (response.error) {
      throw new Error(`HuggingFace API error: ${response.error}`);
    }

    console.error('Invalid HuggingFace response:', response);
    return 'Response not available';
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
      return await client.generate(prompt, toolType, model);
    } catch (error) {
      console.error(`AI generation failed for ${provider}:`, error);
      throw new Error(`AI service error (${provider}): ${error.message}`);
    }
  }

  hasClient(provider) {
    return this.clients.has(provider);
  }
}

export const aiService = new AIService();