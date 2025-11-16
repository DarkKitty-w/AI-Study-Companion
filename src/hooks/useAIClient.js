// src/hooks/useAIClient.js
import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { useApiKeys } from './useApiKeys';
import { aiService } from '../services/aiProviders';
import { globalRateLimiter } from '../utils/rateLimit';

export function useAIClient() {
  const { state, dispatch } = useApp();
  const { apiKeys } = useApiKeys();

  const generateWithAI = useCallback(async (prompt, toolType) => {
    // Validate input
    if (!prompt || !prompt.trim()) {
      throw new Error('Please enter some text to process');
    }

    if (prompt.length < 50) {
      throw new Error('Please enter at least 50 characters for meaningful processing');
    }

    // Check API key
    const apiKey = apiKeys[state.currentProvider];
    if (!apiKey) {
      throw new Error(`Please add your ${state.currentProvider} API key in settings`);
    }

    // Rate limiting
    const userId = 'user';
    if (!globalRateLimiter.checkLimit(userId)) {
      const remaining = globalRateLimiter.getRemainingRequests(userId);
      throw new Error(`Rate limit exceeded. Please wait a minute. ${remaining} requests remaining.`);
    }

    // Set up AI client
    if (!aiService.hasClient(state.currentProvider)) {
      const success = aiService.setClient(state.currentProvider, apiKey);
      if (!success) {
        throw new Error(`Failed to initialize ${state.currentProvider} client. Please check your API key.`);
      }
    }

    // Generate with AI
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await aiService.generate(state.currentProvider, prompt, toolType);
      dispatch({ type: 'SET_OUTPUT', payload: response });
      return response;
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.currentProvider, apiKeys, dispatch]);

  return { generateWithAI };
}