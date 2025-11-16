import React from 'react';
import { Brain, Github } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">AI Study Companion</h1>
                <p className="text-sm text-gray-600">Academic tool for study material processing</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/DarkKitty-w/AI-Study-Companion"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
              title="GitHub Repository"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;