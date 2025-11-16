// src/hooks/useApiKeys.js
import { useState, useEffect } from 'react';
import { encryptData, decryptData } from '../utils/encryption';

const STORAGE_KEY = 'ai_study_companion_api_keys';

export function useApiKeys() {
  const [apiKeys, setApiKeys] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load API keys from encrypted storage
    try {
      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (encrypted) {
        const decrypted = decryptData(encrypted);
        if (decrypted && typeof decrypted === 'object') {
          setApiKeys(decrypted);
        }
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveApiKey = (provider, key) => {
    const newApiKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newApiKeys);
    
    // Encrypt and save to localStorage
    const encrypted = encryptData(newApiKeys);
    if (encrypted) {
      localStorage.setItem(STORAGE_KEY, encrypted);
    }
  };

  const deleteApiKey = (provider) => {
    const newApiKeys = { ...apiKeys };
    delete newApiKeys[provider];
    setApiKeys(newApiKeys);
    
    const encrypted = encryptData(newApiKeys);
    if (encrypted) {
      localStorage.setItem(STORAGE_KEY, encrypted);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const clearAllKeys = () => {
    setApiKeys({});
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    apiKeys,
    saveApiKey,
    deleteApiKey,
    clearAllKeys,
    isLoaded
  };
}