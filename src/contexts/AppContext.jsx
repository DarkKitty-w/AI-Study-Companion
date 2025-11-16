import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AppContext = createContext();

// Load settings from localStorage
const loadSettings = () => {
  try {
    const saved = localStorage.getItem('ai_study_companion_settings');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return null;
};

// Save settings to localStorage
const saveSettings = (settings) => {
  try {
    localStorage.setItem('ai_study_companion_settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
};

const initialState = {
  // AI Settings
  apiKeys: {},
  currentProvider: 'openai',
  
  // Tool State
  currentTool: 'summarize',
  isLoading: false,
  error: null,
  output: null,
  inputText: '',
  
  // Export Settings
  exportFormat: 'text',
  exportPreferences: {
    includeMetadata: true,
    addTimestamp: true,
    askForFilename: false
  },
  
  // Appearance Settings
  theme: 'light',
  interfacePreferences: {
    showToolDescriptions: true,
    showConfirmations: true,
    compactMode: false
  }
};

// Load initial state from localStorage
const savedSettings = loadSettings();
if (savedSettings) {
  Object.assign(initialState, savedSettings);
}

function appReducer(state, action) {
  let newState;
  
  switch (action.type) {
    // AI Settings
    case 'SET_API_KEY':
      newState = {
        ...state,
        apiKeys: {
          ...state.apiKeys,
          [action.payload.provider]: action.payload.key
        }
      };
      break;
    case 'SET_CURRENT_PROVIDER':
      newState = { ...state, currentProvider: action.payload };
      break;
    
    // Tool State
    case 'SET_CURRENT_TOOL':
      newState = { ...state, currentTool: action.payload };
      break;
    case 'SET_LOADING':
      newState = { ...state, isLoading: action.payload };
      break;
    case 'SET_ERROR':
      newState = { ...state, error: action.payload };
      break;
    case 'SET_OUTPUT':
      newState = { ...state, output: action.payload };
      break;
    case 'SET_INPUT_TEXT':
      newState = { ...state, inputText: action.payload };
      break;
    case 'CLEAR_OUTPUT':
      newState = { ...state, output: null, error: null };
      break;
    
    // Export Settings
    case 'SET_EXPORT_FORMAT':
      newState = { ...state, exportFormat: action.payload };
      break;
    case 'SET_EXPORT_PREFERENCE':
      newState = {
        ...state,
        exportPreferences: {
          ...state.exportPreferences,
          [action.payload.key]: action.payload.value
        }
      };
      break;
    
    // Appearance Settings
    case 'SET_THEME':
      newState = { ...state, theme: action.payload };
      break;
    case 'SET_INTERFACE_PREFERENCE':
      newState = {
        ...state,
        interfacePreferences: {
          ...state.interfacePreferences,
          [action.payload.key]: action.payload.value
        }
      };
      break;
    
    // API Key Management
    case 'DELETE_API_KEY':
      const newApiKeys = { ...state.apiKeys };
      delete newApiKeys[action.payload];
      newState = { ...state, apiKeys: newApiKeys };
      break;
    case 'CLEAR_ALL_KEYS':
      newState = { ...state, apiKeys: {} };
      break;
    
    default:
      return state;
  }
  
  // Save to localStorage whenever state changes
  saveSettings(newState);
  return newState;
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(state.theme);
  }, [state.theme]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}