// src/components/tools/DataExtractorTool.jsx
import React, { useState } from 'react';
import { Download, Copy, Database, RotateCcw, Filter, Search, FileText, Globe } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { useAIClient } from '../../hooks/useAIClient'; // 
import { handleExport } from '../../services/exporters';
// import { sanitizeInput } from '../../utils/sanitize'; // 
import { globalRateLimiter } from '../../utils/rateLimit';

const DataExtractorTool = () => {
  const { state, dispatch } = useApp();
  const { apiKeys } = useApiKeys();
  const { generate } = useAIClient(); // 
  const [isCopied, setIsCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [inputType, setInputType] = useState('text');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleInputChange = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
    setCharCount(text.length);
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      // Simulate file reading
      const reader = new FileReader();
      reader.onload = (e) => {
        dispatch({ type: 'SET_INPUT_TEXT', payload: e.target.result });
        setCharCount(e.target.result.length);
      };
      reader.readAsText(uploadedFile);
    }
  };

  // ### FIX: This is the new, correct function that calls the AI ###
  const extractData = async () => {
    // 1. --- Input Validation (from URL, file, or text) ---
    if (inputType === 'url' && url) {
      // In a real implementation, you would fetch the URL content on a backend
      dispatch({ type: 'SET_ERROR', payload: 'URL processing requires a backend implementation (to avoid CORS issues)' });
      return;
    }

    if (!state.inputText.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please provide some content to extract data from' });
      return;
    }
    if (state.inputText.length < 50) {
      dispatch({ type: 'SET_ERROR', payload: 'Please provide at least 50 characters for meaningful data extraction' });
      return;
    }

    // 2. --- API Key Check ---
    const apiKey = apiKeys[state.currentProvider];
    if (!apiKey) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Please add your ${state.currentProvider} API key in settings to use this tool` 
      });
      return;
    }

    // 3. --- Rate Limiting ---
    const userId = 'user';
    if (!globalRateLimiter.checkLimit(userId)) {
      const remaining = globalRateLimiter.getRemainingRequests(userId);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Rate limit exceeded. Please wait a minute. ${remaining} requests remaining.` 
      });
      return;
    }

    // 4. --- Set Loading State ---
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_OUTPUT', payload: null }); // Clear old results

    try {
      // 5. --- Call the AI Service ---
      const aiResponse = await generate(
        state.inputText, 
        'dataextractor' // This must match your promptTemplates.js key
      );

      // 6. --- Parse the AI's JSON Response ---
      if (!aiResponse) {
        throw new Error("The AI returned an empty response.");
      }

      let extractedData;
      if (typeof aiResponse === 'object') {
        // The service already parsed the JSON
        extractedData = aiResponse;
      } else {
        // The AI returned a string, we need to parse it
        try {
          // Find the start of the JSON
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error("AI did not return valid JSON format.");
          }
          extractedData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse AI response:", aiResponse);
          throw new Error("AI returned a malformed data object. Please try again.");
        }
      }

      // 7. --- Validate the JSON structure ---
      if (!extractedData.statistics || !extractedData.definitions || !extractedData.findings) {
        console.error("Invalid data structure:", extractedData);
        throw new Error("AI returned data in an unknown format.");
      }
      
      // Add summary data for the UI
      extractedData.summary = {
        totalExtracted: extractedData.statistics.length + extractedData.definitions.length + extractedData.findings.length,
        dataTypes: ['statistics', 'definitions', 'findings']
      };

      // 8. --- Success: Set the output ---
      dispatch({ type: 'SET_OUTPUT', payload: extractedData });

    } catch (error) {
      // 9. --- Handle Errors ---
      console.error("Data extraction failed:", error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to extract data: ${error.message}` });
    } finally {
      // 10. --- Stop Loading ---
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };


  const handleCopy = async () => {
    // ### FIX: Check for .statistics (or any unique key) ###
    if (state.output?.statistics) {
      try {
        const textOutput = JSON.stringify(state.output, null, 2);
        await navigator.clipboard.writeText(textOutput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to copy to clipboard' });
      }
    }
  };

  const handleExportClick = () => {
    // ### FIX: Check for .statistics ###
    if (state.output?.statistics) {
      try {
        const content = state.exportFormat === 'json' 
          ? JSON.stringify(state.output, null, 2)
          : formatDataAsText(state.output);
        
        handleExport(content, state.exportFormat, 'ai-study-data', 'AI Study Companion - Extracted Data');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Export failed: ${error.message}` });
      }
    }
  };

  const formatDataAsText = (data) => {
    let text = `Data Extracted: ${new Date().toLocaleString()}\n`;
    text += `Total Items Extracted: ${data.summary.totalExtracted}\n\n`;
    
    if (data.statistics?.length > 0) {
      text += `📊 STATISTICS (${data.statistics.length} items)\n`;
      text += '─'.repeat(50) + '\n';
      data.statistics.forEach(stat => {
        text += `• ${stat.value} - ${stat.context}\n`;
      });
      text += '\n';
    }
    
    if (data.definitions?.length > 0) {
      text += `📖 DEFINITIONS (${data.definitions.length} items)\n`;
      text += '─'.repeat(50) + '\n';
      data.definitions.forEach(def => {
        text += `• ${def.term}: ${def.definition}\n`;
      });
      text += '\n';
    }
    
    if (data.findings?.length > 0) {
      text += `🔍 FINDINGS (${data.findings.length} items)\n`;
      text += '─'.repeat(50) + '\n';
      data.findings.forEach(finding => {
        text += `• [${finding.confidence}] ${finding.finding}\n`;
      });
    }
    
    return text;
  };

  const handleClear = () => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' });
    dispatch({ type: 'SET_OUTPUT', payload: null });
    setCharCount(0);
    setUrl('');
    setFile(null);
    setFilter('all');
    setSearchTerm('');
  };

  const filteredData = () => {
    // ### FIX: Check for .statistics to prevent crash ###
    if (!state.output?.statistics) {
      return { statistics: [], definitions: [], findings: [] };
    }
    
    let data = { ...state.output };
    
    // Apply type filter
    if (filter !== 'all') {
      data = {
        ...data,
        statistics: filter === 'statistics' ? data.statistics : [],
        definitions: filter === 'definitions' ? data.definitions : [],
        findings: filter === 'findings' ? data.findings : []
      };
    }
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      data = {
        ...data,
        statistics: data.statistics.filter(item => 
          item.value.toLowerCase().includes(searchLower) ||
          item.context.toLowerCase().includes(searchLower)
        ),
        definitions: data.definitions.filter(item =>
          item.term.toLowerCase().includes(searchLower) ||
          item.definition.toLowerCase().includes(searchLower)
        ),
        findings: data.findings.filter(item =>
          item.finding.toLowerCase().includes(searchLower)
        )
      };
    }
    
    return data;
  };

  const currentData = filteredData();

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Database className="h-5 w-5 text-indigo-500" />
            <span>Extract Data</span>
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
          {/* Input Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Source
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setInputType('text')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  inputType === 'text'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">Text</span>
              </button>
              <button
                onClick={() => setInputType('file')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  inputType === 'file'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Database className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">File</span>
              </button>
              <button
                onClick={() => setInputType('url')}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  inputType === 'url'
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className="h-5 w-5 mx-auto mb-1 text-gray-600" />
                <span className="text-sm font-medium">URL</span>
              </button>
            </div>
          </div>

          {/* Dynamic Input Based on Type */}
          {inputType === 'text' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your content {charCount > 0 && (
                  <span className="text-xs text-gray-500 ml-2">({charCount} characters)</span>
                )}
              </label>
              <textarea
                value={state.inputText}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Paste research papers, articles, reports, or any text containing data, statistics, definitions, or findings...

Example: 'The study found that 75% of participants showed significant improvement. Machine learning is defined as a subset of artificial intelligence. Results indicate a 2.5x increase in efficiency. Key findings include a correlation coefficient of 0.85.'"
                rows={8}
                className="input-field resize-none font-mono text-sm"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Minimum 50 characters recommended</span>
                <span>{charCount}/25000</span>
              </div>
            </div>
          )}

          {inputType === 'file' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".txt,.pdf,.doc,.docx" // Note: PDF/DOC parsing needs a backend
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-2">
                    {file ? file.name : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-gray-500">
                    TXT files only (PDF/DOC requires backend)
                  </p>
                </label>
              </div>
            </div>
          )}

          {inputType === 'url' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter URL
              </label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/research-paper"
                className="input-field"
              />
              <p className="text-xs text-gray-500 mt-1">
                Note: URL processing requires additional backend implementation
              </p>
            </div>
          )}

          <button
            onClick={extractData}
            disabled={state.isLoading || (!state.inputText.trim() && !url.trim())}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Database className="h-4 w-4 mr-2" />
            {state.isLoading ? 'Extracting Data...' : 'Extract Data'}
          </button>
        </div>
      </div>

      {/* Output Section */}
      {/* ### FIX: Check for .statistics to prevent crash ### */}
      {state.output?.statistics && (
        <div className="card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Database className="h-5 w-5 text-indigo-500" />
              <span>Extracted Data ({state.output.summary?.totalExtracted || 0} items)</span>
            </h2>
            <div className="flex items-center space-x-2">
              <select
                value={state.exportFormat}
                onChange={(e) => dispatch({ type: 'SET_EXPORT_FORMAT', payload: e.target.value })}
                className="input-field text-sm w-32"
              >
                <option value="json">JSON</option>
                <option value="text">Text</option>
                <option value="pdf">PDF</option>
                <option value="markdown">Markdown</option>
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

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-6">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field text-sm w-32"
              >
                <option value="all">All Data</option>
                <option value="statistics">Statistics</option>
                <option value="definitions">Definitions</option>
                <option value="findings">Findings</option>
              </select>
            </div>
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search extracted data..."
                className="input-field text-sm flex-1"
              />
            </div>
          </div>

          {/* Data Display */}
          <div className="space-y-6">
            {/* Statistics */}
            {currentData.statistics.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="text-lg font-medium text-blue-900 mb-3 flex items-center">
                  <span className="bg-blue-500 text-white p-1 rounded mr-2">📊</span>
                  Statistics ({currentData.statistics.length})
                </h3>
                <div className="space-y-2">
                  {currentData.statistics.map((stat, index) => (
                    <div key={stat.id || index} className="bg-white rounded-lg p-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-700 text-lg">{stat.value}</span>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Statistic</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{stat.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Definitions */}
            {currentData.definitions.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="text-lg font-medium text-green-900 mb-3 flex items-center">
                  <span className="bg-green-500 text-white p-1 rounded mr-2">📖</span>
                  Definitions ({currentData.definitions.length})
                </h3>
                <div className="space-y-3">
                  {currentData.definitions.map((def, index) => (
                    <div key={def.id || index} className="bg-white rounded-lg p-3 border border-green-100">
                      <h4 className="font-medium text-green-700">{def.term}</h4>
                      <p className="text-sm text-gray-700 mt-1">{def.definition}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Findings */}
            {currentData.findings.length > 0 && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="text-lg font-medium text-purple-900 mb-3 flex items-center">
                  <span className="bg-purple-500 text-white p-1 rounded mr-2">🔍</span>
                  Findings ({currentData.findings.length})
                </h3>
                <div className="space-y-3">
                  {currentData.findings.map((finding, index) => (
                    <div key={finding.id || index} className="bg-white rounded-lg p-3 border border-purple-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-purple-700">Finding</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          parseFloat(finding.confidence) > 80 
                            ? 'bg-green-100 text-green-800'
                            : parseFloat(finding.confidence) > 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          Confidence: {finding.confidence}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{finding.finding}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {currentData.statistics.length === 0 && 
             currentData.definitions.length === 0 && 
             currentData.findings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No data found matching your criteria</p>
                <p className="text-sm mt-1">Try changing your filters or search term</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {/* ### FIX: Check if output is NOT a data object (or is null) ### */}
      {(!state.output?.statistics) && !state.isLoading && (
        <div className="card text-center py-12">
          <Database className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Extract Structured Data</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Upload documents or paste text to automatically extract statistics, definitions, and key findings into a structured, searchable database.
          </p>
        </div>
      )}
    </div>
  );
};

export default DataExtractorTool;