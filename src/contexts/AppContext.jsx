// src/contexts/AppContext.jsx
import React, { createContext, useContext, useReducer } from 'react';

const AppContext = createContext();

const initialState = {
  apiKeys: {},
  currentTool: 'summarize',
  currentProvider: 'openai',
  isLoading: false,
  error: null,
  output: null,
  inputText: '',
  exportFormat: 'text'
};

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_API_KEY':
      return {
        ...state,
        apiKeys: {
          ...state.apiKeys,
          [action.payload.provider]: action.payload.key
        }
      };
    case 'SET_CURRENT_TOOL':
      return { ...state, currentTool: action.payload };
    case 'SET_CURRENT_PROVIDER':
      return { ...state, currentProvider: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_OUTPUT':
      return { ...state, output: action.payload };
    case 'SET_INPUT_TEXT':
      return { ...state, inputText: action.payload };
    case 'SET_EXPORT_FORMAT':
      return { ...state, exportFormat: action.payload };
    case 'CLEAR_OUTPUT':
      return { ...state, output: null, error: null };
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

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