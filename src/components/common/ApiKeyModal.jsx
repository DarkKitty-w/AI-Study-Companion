// src/components/common/ApiKeyModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { validateApiKey } from '../../utils/sanitize';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo, GPT-4o',
    placeholder: 'sk-...',
    format: 'starts with sk- and 51 characters'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude-3, Claude-2',
    placeholder: 'sk-ant-...',
    format: 'starts with sk-ant- and 95+ characters'
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Gemini Flash',
    placeholder: 'AIza...',
    format: 'starts with AIza and 39 characters'
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    description: '200,000+ open models',
    placeholder: 'hf_...',
    format: 'starts with hf_ and 39+ characters'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference',
    placeholder: 'gsk_...',
    format: 'starts with gsk_ and 32 characters'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Cost-effective models',
    placeholder: 'sk-...',
    format: 'similar to OpenAI format'
  }
];

const ApiKeyModal = () => {
  const { state, dispatch } = useApp();
  const { apiKeys, saveApiKey, deleteApiKey, clearAllKeys } = useApiKeys();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Check if we need to open modal (no API keys)
    if (Object.keys(apiKeys).length === 0 && state.currentTool) {
      setIsOpen(true);
    }
  }, [apiKeys, state.currentTool]);

  const handleSave = () => {
    setError('');
    setSuccess('');

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    if (!validateApiKey(apiKey, selectedProvider)) {
      const provider = PROVIDERS.find(p => p.id === selectedProvider);
      setError(`Invalid API key format for ${provider?.name}. Expected: ${provider?.format}`);
      return;
    }

    saveApiKey(selectedProvider, apiKey);
    setApiKey('');
    setSuccess(`API key for ${PROVIDERS.find(p => p.id === selectedProvider)?.name} saved successfully!`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDelete = (provider) => {
    deleteApiKey(provider);
    setSuccess(`API key for ${PROVIDERS.find(p => p.id === provider)?.name} removed`);
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSuccess('');
    setApiKey('');
    setShowKey(false);
  };

  const currentProvider = PROVIDERS.find(p => p.id === selectedProvider);

  return (
    <>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 z-40 group"
      >
        <Key className="h-6 w-6" />
        <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
          API Keys
        </div>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Shield className="h-6 w-6 text-blue-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">API Key Management</h2>
                  <p className="text-gray-600">Your keys are encrypted and stored locally</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Provider Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select AI Provider
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {PROVIDERS.map(provider => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        selectedProvider === provider.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{provider.name}</div>
                      <div className="text-xs text-gray-600 mt-1">{provider.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {currentProvider?.name} API Key
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={currentProvider?.placeholder}
                    className="input-field pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Format: {currentProvider?.format}
                </p>
              </div>

              {/* Messages */}
              {error && (
                <div className="rounded-lg bg-red-50 p-4 mb-4 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {success && (
                <div className="rounded-lg bg-green-50 p-4 mb-4 border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    <p className="text-sm text-green-700">{success}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 mb-6">
                <button
                  onClick={handleSave}
                  className="btn-primary flex-1 flex items-center justify-center"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Save API Key
                </button>
                <button
                  onClick={clearAllKeys}
                  className="btn-secondary"
                >
                  Clear All
                </button>
              </div>

              {/* Saved Keys */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Saved Keys</h3>
                <div className="space-y-2">
                  {Object.entries(apiKeys).map(([provider, key]) => {
                    const providerInfo = PROVIDERS.find(p => p.id === provider);
                    return (
                      <div
                        key={provider}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900">
                              {providerInfo?.name}
                            </span>
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                          <div className="text-sm text-gray-600 font-mono">
                            {key.substring(0, 8)}...{key.substring(key.length - 4)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(provider)}
                          className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                  {Object.keys(apiKeys).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Key className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No API keys saved yet</p>
                      <p className="text-sm mt-1">Add your first API key to get started</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApiKeyModal;