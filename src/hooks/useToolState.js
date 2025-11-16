import { useApp } from '../contexts/AppContext';

export function useToolState() {
  const { state, dispatch } = useApp();
  
  const setInputText = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
  };

  const setOutput = (output) => {
    dispatch({ type: 'SET_OUTPUT', payload: output });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearOutput = () => {
    dispatch({ type: 'CLEAR_OUTPUT' });
  };

  return {
    inputText: state.inputText,
    output: state.output,
    isLoading: state.isLoading,
    error: state.error,
    currentTool: state.currentTool,
    currentProvider: state.currentProvider,
    setInputText,
    setOutput,
    setLoading,
    setError,
    clearOutput
  };
}