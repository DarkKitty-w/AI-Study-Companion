// src/components/layout/MainContent.jsx
import React from 'react';
import { useApp } from '../../contexts/AppContext';
import SummarizeTool from '../tools/SummarizeTool';
import FlashcardsTool from '../tools/FlashcardsTool';
import QuizTool from '../tools/QuizTool';
import MindMapTool from '../tools/MindMapTool';
import DataExtractorTool from '../tools/DataExtractorTool';
import ErrorMessage from '../common/ErrorMessage';
import LoadingSpinner from '../common/LoadingSpinner';

const TOOL_COMPONENTS = {
  summarize: SummarizeTool,
  flashcards: FlashcardsTool,
  quiz: QuizTool,
  mindmap: MindMapTool,
  dataextractor: DataExtractorTool
};

const PROVIDER_INFO = {
  openai: { name: 'OpenAI', models: ['gpt-4', 'gpt-3.5-turbo', 'gpt-4o'] },
  anthropic: { name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
  google: { name: 'Google AI', models: ['gemini-pro', 'gemini-flash'] },
  huggingface: { name: 'HuggingFace', models: ['custom models'] },
  groq: { name: 'Groq', models: ['llama2-70b', 'mixtral-8x7b'] },
  deepseek: { name: 'DeepSeek', models: ['deepseek-chat', 'deepseek-coder'] }
};

const MainContent = () => {
  const { state, dispatch } = useApp();
  const CurrentTool = TOOL_COMPONENTS[state.currentTool] || SummarizeTool;

  return (
    <div className="space-y-6">
      {/* Provider Selector */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Provider Settings</h2>
            <p className="text-gray-600">Choose which AI service to power your study tools</p>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <select
              value={state.currentProvider}
              onChange={(e) => dispatch({ type: 'SET_CURRENT_PROVIDER', payload: e.target.value })}
              className="input-field sm:w-48"
            >
              {Object.entries(PROVIDER_INFO).map(([id, info]) => (
                <option key={id} value={id}>
                  {info.name}
                </option>
              ))}
            </select>
            
            <select
              value={state.exportFormat}
              onChange={(e) => dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value })}
              className="input-field sm:w-32"
            >
              <option value="text">Text</option>
              <option value="pdf">PDF</option>
              <option value="json">JSON</option>
              <option value="markdown">Markdown</option>
            </select>
          </div>
        </div>

        {/* Provider Details */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-gray-600">Available models:</span>
            <div className="flex flex-wrap gap-1">
              {PROVIDER_INFO[state.currentProvider]?.models.map((model, index) => (
                <span
                  key={model}
                  className="px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-700"
                >
                  {model}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <ErrorMessage
          error={state.error}
          onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })}
          onRetry={() => dispatch({ type: 'SET_ERROR', payload: null })}
        />
      )}

      {/* Loading State */}
      {state.isLoading && (
        <div className="card">
          <LoadingSpinner
            size="large"
            text={`Processing with ${PROVIDER_INFO[state.currentProvider]?.name}...`}
          />
        </div>
      )}

      {/* Tool Content */}
      {!state.isLoading && <CurrentTool />}
    </div>
  );
};

export default MainContent;