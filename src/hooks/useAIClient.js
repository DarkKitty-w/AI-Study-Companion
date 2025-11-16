// src/hooks/useAIClient.js
import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useApiKeys } from './useApiKeys';
import { aiService } from '../services/aiProviders';

export function useAIClient() {
  const { state } = useApp();
  const { apiKeys } = useApiKeys();

  // This hook now has ONE job:
  // Set up the aiService and return a "generate" function
  // for components to use.
  
  // All dispatch/loading/error logic is handled
  // in the component itself (e.g., QuizTool.jsx), which is correct.

  const generate = useCallback(async (prompt, toolType, model = null) => {
    
    // 1. Get the current provider and API key
    const provider = state.currentProvider;
    const apiKey = apiKeys[provider];

    if (!apiKey) {
      throw new Error(`Please add your ${provider} API key in settings`);
    }

    // 2. Ensure the client is set up in the service
    // (This is fast and only runs once per provider)
    if (!aiService.hasClient(provider)) {
      const success = aiService.setClient(provider, apiKey);
      if (!success) {
        throw new Error(`Failed to initialize ${provider} client. Check your API key.`);
      }
    }

    // 3. Call the AI service and return the response
    // The component will handle try/catch and loading/error states.
    const modelToUse = model || state.models?.[provider];
    
    return await aiService.generate(provider, prompt, toolType, modelToUse);

  }, [state.currentProvider, apiKeys, state.models]);

  // ### FIX: Return 'generate' to match what QuizTool.jsx expects ###
  return { generate };
}