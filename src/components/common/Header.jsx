// src/components/common/Header.jsx
import React from 'react';
import { Brain, Github, Settings, Shield } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const Header = () => {
  const { state, dispatch } = useApp();

  return (
    <header className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Study Companion
              </h1>
              <p className="text-gray-600 mt-1">Transform your study materials with AI</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
            <Shield className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">Secure & Local</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <div className={`w-3 h-3 rounded-full ${state.currentProvider === 'openai' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-blue-700 font-medium">
              {state.currentProvider.charAt(0).toUpperCase() + state.currentProvider.slice(1)}
            </span>
          </div>
          
          <a
            href="https://github.com/your-username/ai-study-companion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg"
          >
            <Github className="h-5 w-5" />
            <span className="hidden sm:block">GitHub</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;