import React, { useState } from 'react';
import { X, Key, Palette, Download, Moon, Sun, Monitor, Check } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { validateApiKey } from '../../utils/sanitize';

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4, GPT-3.5 Turbo, GPT-4o',
    placeholder: 'sk-...'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    description: 'Claude-3, Claude-2',
    placeholder: 'sk-ant-...'
  },
  {
    id: 'google',
    name: 'Google AI',
    description: 'Gemini Pro, Gemini Flash',
    placeholder: 'AIza...'
  },
  {
    id: 'huggingface',
    name: 'HuggingFace',
    description: '200,000+ open models',
    placeholder: 'hf_...'
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Ultra-fast inference',
    placeholder: 'gsk_...'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Cost-effective models',
    placeholder: 'sk-...'
  }
];

const THEMES = [
  { id: 'light', name: 'Light', icon: Sun, description: 'Clean light theme' },
  { id: 'dark', name: 'Dark', icon: Moon, description: 'Dark mode' },
  { id: 'system', name: 'System', icon: Monitor, description: 'Follow system setting' }
];

const SettingsModal = () => {
  const { state, dispatch } = useApp();
  const { apiKeys, saveApiKey, deleteApiKey, clearAllKeys } = useApiKeys();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ai');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSaveApiKey = () => {
    setError('');
    setSuccess('');

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    if (!validateApiKey(apiKey, selectedProvider)) {
      setError('Invalid API key format');
      return;
    }

    saveApiKey(selectedProvider, apiKey);
    setApiKey('');
    setSuccess('API key saved successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleExportPreferenceChange = (key, value) => {
    dispatch({
      type: 'SET_EXPORT_PREFERENCE',
      payload: { key, value }
    });
  };

  const handleInterfacePreferenceChange = (key, value) => {
    dispatch({
      type: 'SET_INTERFACE_PREFERENCE',
      payload: { key, value }
    });
  };

  const handleThemeChange = (theme) => {
    dispatch({
      type: 'SET_THEME',
      payload: theme
    });
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
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-lg shadow-lg transition-colors duration-200 z-40 flex items-center space-x-2"
        title="Settings"
      >
        <Palette className="h-5 w-5" />
        <span className="text-sm font-medium">Settings</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
                <p className="text-gray-600 mt-1">Configure your AI Study Companion</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'ai' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Key className="h-4 w-4" />
                <span>AI Providers</span>
              </button>
              <button
                onClick={() => setActiveTab('export')}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'export' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Download className="h-4 w-4" />
                <span>Export Settings</span>
              </button>
              <button
                onClick={() => setActiveTab('appearance')}
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 transition-colors ${
                  activeTab === 'appearance' 
                    ? 'border-blue-600 text-blue-600' 
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>Appearance</span>
              </button>
            </div>

            <div className="p-6">
              {/* AI Providers Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">AI Provider Configuration</h3>
                    
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Default AI Provider
                      </label>
                      <select
                        value={state.currentProvider}
                        onChange={(e) => dispatch({ type: 'SET_CURRENT_PROVIDER', payload: e.target.value })}
                        className="input-field max-w-xs"
                      >
                        {PROVIDERS.map(provider => (
                          <option key={provider.id} value={provider.id}>
                            {provider.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        This provider will be used by default for all tools.
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">API Key Management</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Provider
                          </label>
                          <select
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            className="input-field"
                          >
                            {PROVIDERS.map(provider => (
                              <option key={provider.id} value={provider.id}>
                                {provider.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            API Key
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
                              onClick={() => setShowKey(!showKey)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                            >
                              {showKey ? 'Hide' : 'Show'}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-3 mb-6">
                        <button
                          onClick={handleSaveApiKey}
                          className="btn-primary flex items-center space-x-2"
                        >
                          <Key className="h-4 w-4" />
                          <span>Save API Key</span>
                        </button>
                        <button
                          onClick={clearAllKeys}
                          className="btn-secondary"
                        >
                          Clear All Keys
                        </button>
                      </div>

                      {error && (
                        <div className="rounded-lg bg-red-50 p-4 mb-4 border border-red-200">
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      )}

                      {success && (
                        <div className="rounded-lg bg-green-50 p-4 mb-4 border border-green-200">
                          <p className="text-sm text-green-700">{success}</p>
                        </div>
                      )}

                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-3">Saved API Keys</h5>
                        <div className="space-y-2">
                          {Object.entries(apiKeys).map(([provider, key]) => {
                            const providerInfo = PROVIDERS.find(p => p.id === provider);
                            return (
                              <div
                                key={provider}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-3">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <div>
                                    <div className="font-medium text-gray-900 text-sm">
                                      {providerInfo?.name}
                                    </div>
                                    <div className="text-xs text-gray-600 font-mono">
                                      {key.substring(0, 6)}...{key.substring(key.length - 4)}
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteApiKey(provider)}
                                  className="text-red-600 hover:text-red-800 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            );
                          })}
                          {Object.keys(apiKeys).length === 0 && (
                            <div className="text-center py-6 text-gray-500">
                              <Key className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                              <p className="text-sm">No API keys saved</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export Settings Tab */}
              {activeTab === 'export' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Export Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Export Format
                      </label>
                      <select
                        value={state.exportFormat}
                        onChange={(e) => dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value })}
                        className="input-field max-w-xs"
                      >
                        <option value="text">Plain Text (.txt)</option>
                        <option value="pdf">PDF Document</option>
                        <option value="json">JSON Data</option>
                        <option value="markdown">Markdown</option>
                      </select>
                      <p className="text-sm text-gray-500 mt-2">
                        This format will be used when exporting generated content.
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Export Preferences</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.exportPreferences.includeMetadata}
                            onChange={(e) => handleExportPreferenceChange('includeMetadata', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Include metadata in exports</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.exportPreferences.addTimestamp}
                            onChange={(e) => handleExportPreferenceChange('addTimestamp', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Add timestamp to filenames</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.exportPreferences.askForFilename}
                            onChange={(e) => handleExportPreferenceChange('askForFilename', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Ask for filename before each export</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Appearance</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Color Theme
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {THEMES.map(theme => {
                          const Icon = theme.icon;
                          const isActive = state.theme === theme.id;
                          return (
                            <button
                              key={theme.id}
                              onClick={() => handleThemeChange(theme.id)}
                              className={`p-4 rounded-lg border-2 text-left transition-colors relative ${
                                isActive 
                                  ? 'border-blue-600 bg-blue-50' 
                                  : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {isActive && (
                                <div className="absolute top-2 right-2">
                                  <Check className="h-5 w-5 text-blue-600" />
                                </div>
                              )}
                              <div className="flex items-center space-x-3 mb-2">
                                <Icon className="h-5 w-5 text-gray-600" />
                                <span className="font-medium text-gray-900">{theme.name}</span>
                              </div>
                              <p className="text-sm text-gray-600">{theme.description}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-md font-medium text-gray-900 mb-3">Interface Preferences</h4>
                      <div className="space-y-3">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.interfacePreferences.showToolDescriptions}
                            onChange={(e) => handleInterfacePreferenceChange('showToolDescriptions', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Show tool descriptions</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.interfacePreferences.showConfirmations}
                            onChange={(e) => handleInterfacePreferenceChange('showConfirmations', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Show confirmation dialogs</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={state.interfacePreferences.compactMode}
                            onChange={(e) => handleInterfacePreferenceChange('compactMode', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                          <span className="text-sm text-gray-700">Compact mode</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsModal;