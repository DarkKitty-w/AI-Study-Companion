// src/components/tools/SummarizeTool.jsx
import React, { useState } from 'react';
import { Download, Copy, Sparkles, FileText, RotateCcw } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { handleExport } from '../../services/exporters';
import { sanitizeInput } from '../../utils/sanitize';
import { globalRateLimiter } from '../../utils/rateLimit';

const SummarizeTool = () => {
  const { state, dispatch } = useApp();
  const { apiKeys } = useApiKeys();
  const [isCopied, setIsCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const handleInputChange = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
    setCharCount(text.length);
  };

  const handleSummarize = async () => {
    // Input validation
    const sanitizedInput = sanitizeInput(state.inputText);
    if (!sanitizedInput.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter some text to summarize' });
      return;
    }

    if (sanitizedInput.length < 50) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter at least 50 characters for meaningful summarization' });
      return;
    }

    // API key check
    const apiKey = apiKeys[state.currentProvider];
    if (!apiKey) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Please add your ${state.currentProvider} API key in settings to use this tool` 
      });
      return;
    }

    // Rate limiting
    const userId = 'user'; // In real app, use actual user ID
    if (!globalRateLimiter.checkLimit(userId)) {
      const remaining = globalRateLimiter.getRemainingRequests(userId);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Rate limit exceeded. Please wait a minute. ${remaining} requests remaining.` 
      });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Simulate AI processing - in real implementation, this would call the AI service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulated summary based on input
      const sentences = sanitizedInput.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const summaryPoints = sentences.slice(0, 5).map(sentence => 
        `• ${sentence.trim().replace(/^[a-z]/, c => c.toUpperCase())}`
      ).join('\n');
      
      const simulatedSummary = `📝 **Summary**\n\n${summaryPoints}\n\n💡 **Key Takeaways:**\n• Generated from ${sentences.length} sentences\n• Focused on main points\n• Perfect for quick review`;
      
      dispatch({ type: 'SET_OUTPUT', payload: simulatedSummary });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate summary: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleCopy = async () => {
    if (state.output) {
      try {
        await navigator.clipboard.writeText(state.output);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to copy to clipboard' });
      }
    }
  };

  const handleExportClick = () => {
    if (state.output) {
      try {
        handleExport(state.output, state.exportFormat, 'ai-study-summary', 'AI Study Companion - Summary');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Export failed: ${error.message}` });
      }
    }
  };

  const handleClear = () => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' });
    dispatch({ type: 'SET_OUTPUT', payload: null });
    setCharCount(0);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <span>Summarize Text</span>
          </h2>
          {state.inputText && (
            <button
              onClick={handleClear}
              className="flex items-center space-x-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Clear</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your text to summarize {charCount > 0 && (
                <span className="text-xs text-gray-500 ml-2">({charCount} characters)</span>
              )}
            </label>
            <textarea
              value={state.inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste your lecture notes, article, textbook content, or any study material you want to summarize... 
              
Example: 'Machine learning is a subset of artificial intelligence that enables computers to learn and make decisions without being explicitly programmed. It uses algorithms to identify patterns in data and make predictions.'"
              rows={10}
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 50 characters recommended</span>
              <span>{charCount}/10000</span>
            </div>
          </div>

          <button
            onClick={handleSummarize}
            disabled={state.isLoading || !state.inputText.trim()}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {state.isLoading ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </div>
      </div>

      {/* Output Section */}
      {state.output && (
        <div className="card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-500" />
              <span>Generated Summary</span>
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={state.exportFormat}
                onChange={(e) => dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value })}
                className="input-field text-sm w-32"
              >
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
              </select>
              <button
                onClick={handleExportClick}
                className="btn-secondary flex items-center text-sm"
              >
                <Download className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={handleCopy}
                className="btn-secondary flex items-center text-sm"
              >
                <Copy className="h-4 w-4 mr-1" />
                {isCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
            <pre className="whitespace-pre-wrap text-gray-800 font-sans text-sm leading-relaxed">
              {state.output}
            </pre>
          </div>

          {/* Usage Tips */}
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">🎯 How to Use This Summary</h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• Use for quick review before exams</li>
              <li>• Share with study groups</li>
              <li>• Export to your preferred note-taking app</li>
              <li>• Combine with flashcards for active recall</li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!state.output && !state.isLoading && (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Summarize</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter your study materials above and click "Generate Summary" to get a concise overview of your content.
          </p>
        </div>
      )}
    </div>
  );
};

export default SummarizeTool;