// src/components/common/LoadingSpinner.jsx
import React from 'react';
import { Brain, Loader } from 'lucide-react';

const LoadingSpinner = ({ size = 'medium', text = 'AI is thinking...' }) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className="relative">
        <div
          className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 ${sizeClasses[size]} mb-4`}
        ></div>
        <Brain className="h-4 w-4 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
      {text && (
        <div className="text-center">
          <p className="text-gray-600 font-medium">{text}</p>
          <p className="text-sm text-gray-500 mt-1">This may take a few seconds</p>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;