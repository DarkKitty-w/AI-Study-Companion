// src/components/layout/ToolSelector.jsx
import React from 'react';
import { FileText, Cards, HelpCircle, MindMap, Database, Sparkles } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const TOOLS = [
  {
    id: 'summarize',
    name: 'Summarize',
    description: 'Convert long notes into concise bullet points',
    icon: FileText,
    color: 'from-blue-500 to-cyan-500',
    badge: 'Quick'
  },
  {
    id: 'flashcards',
    name: 'Flashcards',
    description: 'Generate Q&A flashcards in JSON format',
    icon: Cards,
    color: 'from-green-500 to-emerald-500',
    badge: 'Study'
  },
  {
    id: 'quiz',
    name: 'Quiz',
    description: 'Create multiple-choice questions',
    icon: HelpCircle,
    color: 'from-purple-500 to-pink-500',
    badge: 'Test'
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Generate hierarchical mind maps',
    icon: MindMap,
    color: 'from-orange-500 to-red-500',
    badge: 'Visual'
  },
  {
    id: 'dataextractor',
    name: 'Data Extractor',
    description: 'Extract key stats and definitions',
    icon: Database,
    color: 'from-indigo-500 to-purple-500',
    badge: 'Advanced'
  }
];

const ToolSelector = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-6">
        <Sparkles className="h-5 w-5 text-purple-500" />
        <h2 className="text-xl font-bold text-gray-900">Study Tools</h2>
      </div>
      
      <div className="space-y-3">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            onClick={() => dispatch({ type: 'SET_CURRENT_TOOL', payload: tool.id })}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 group hover:shadow-md ${
              state.currentTool === tool.id
                ? `border-gray-300 bg-gradient-to-r ${tool.color} bg-opacity-5 shadow-sm`
                : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${tool.color} group-hover:scale-110 transition-transform`}>
                <tool.icon className="h-5 w-5 text-white" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className={`font-semibold text-gray-900 group-hover:text-gray-800 ${
                    state.currentTool === tool.id ? `text-transparent bg-gradient-to-r ${tool.color} bg-clip-text` : ''
                  }`}>
                    {tool.name}
                  </h3>
                  <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${tool.color} text-white font-medium`}>
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
              </div>
              
              {state.currentTool === tool.id && (
                <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex-shrink-0 mt-2"></div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Usage Tips */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Pro Tip</h3>
        <p className="text-xs text-blue-700">
          Start with "Summarize" for quick overviews, then use "Flashcards" and "Quiz" for active recall practice.
        </p>
      </div>
    </div>
  );
};

export default ToolSelector;