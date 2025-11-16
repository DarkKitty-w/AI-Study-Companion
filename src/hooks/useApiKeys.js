import { useApp } from '../contexts/AppContext';

export function useApiKeys() {
  const { state, dispatch } = useApp();

  const saveApiKey = (provider, key) => {
    dispatch({ 
      type: 'SET_API_KEY', 
      payload: { provider, key } 
    });
  };

  const deleteApiKey = (provider) => {
    dispatch({ 
      type: 'DELETE_API_KEY', 
      payload: provider 
    });
  };

  const clearAllKeys = () => {
    dispatch({ 
      type: 'CLEAR_ALL_KEYS' 
    });
  };

  return {
    apiKeys: state.apiKeys,
    saveApiKey,
    deleteApiKey,
    clearAllKeys
  };
}