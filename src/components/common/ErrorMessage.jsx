// src/components/common/ErrorMessage.jsx
import React from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';

const ErrorMessage = ({ error, onDismiss, onRetry }) => {
  if (!error) return null;

  return (
    <div className="rounded-lg bg-red-50 p-4 border border-red-200 animate-fade-in">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <div className="mt-3 flex space-x-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center text-sm bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-md transition-colors"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </button>
            )}
            <button
              onClick={onDismiss}
              className="inline-flex items-center text-sm text-red-700 hover:text-red-800 px-3 py-1 rounded-md transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;