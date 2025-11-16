// src/components/common/Footer.jsx
import React from 'react';
import { Heart, Lock, Coffee } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-16 text-center text-gray-600 border-t border-gray-200 pt-8">
      <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6">
        <div className="flex items-center space-x-2">
          <Coffee className="h-4 w-4" />
          <span>Built with caffeine and ❤️</span>
        </div>
        <div className="flex items-center space-x-2">
          <Lock className="h-4 w-4" />
          <span>Your data never leaves your browser</span>
        </div>
      </div>
      <p className="mt-4 text-sm">
        Made for students by students • 
        <a
          href="https://github.com/your-username/ai-study-companion"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 underline ml-1"
        >
          Star on GitHub
        </a>
      </p>
    </footer>
  );
};

export default Footer;