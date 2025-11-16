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

const MainContent = () => {
  const { state } = useApp();
  const CurrentTool = TOOL_COMPONENTS[state.currentTool] || SummarizeTool;

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {state.error && (
        <ErrorMessage
          error={state.error}
          onDismiss={() => dispatch({ type: 'SET_ERROR', payload: null })}
        />
      )}

      {/* Loading State */}
      {state.isLoading && (
        <div className="card">
          <LoadingSpinner
            size="large"
            text="Processing your content..."
          />
        </div>
      )}

      {/* Tool Content */}
      {!state.isLoading && <CurrentTool />}
    </div>
  );
};

export default MainContent;