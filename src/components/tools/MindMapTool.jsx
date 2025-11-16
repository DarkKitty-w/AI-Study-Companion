// src/components/tools/MindMapTool.jsx
import React, { useState } from 'react';
import { Download, Copy, Layers, RotateCcw, Expand, Minus, Plus } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useAIClient } from '../../hooks/useAIClient'; 
// import { sanitizeInput } from '../../utils/sanitize'; // 
import { globalRateLimiter } from '../../utils/rateLimit';

const MindMapTool = () => {
  const { state, dispatch } = useApp();
  const { generate } = useAIClient(); // 
  const [isCopied, setIsCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState('markdown');

  const handleInputChange = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
    setCharCount(text.length);
  };

  const generateMindMap = async () => {
    // ### FIX: Use the raw state.inputText ###
    const promptText = state.inputText; 
    if (!promptText.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter some text to generate a mind map' });
      return;
    }

    if (promptText.length < 100) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter at least 100 characters for a meaningful mind map' });
      return;
    }

    // API key and rate limit checks are now correctly handled by useAIClient

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_OUTPUT', payload: null }); // Clear old results

    try {
      // Create a detailed prompt specifying the exact JSON structure
      const prompt = `
        Based on the following text, generate a mind map. The output must be a single, valid JSON object.

        The JSON structure must be:
        {
          "metadata": {
            "generatedAt": "ISO_DATE_STRING",
            "sourceLength": ${promptText.length},
            "provider": "${state.currentProvider}"
          },
          "centralIdea": "A concise central theme based on the text",
          "topics": [
            {
              "id": "A_UNIQUE_ID_1",
              "name": "Main Topic 1",
              "subtopics": [
                {
                  "id": "A_UNIQUE_ID_1-1",
                  "name": "Subtopic 1.1",
                  "details": "A brief detail or explanation for Subtopic 1.1"
                }
              ]
            },
            {
              "id": "A_UNIQUE_ID_2",
              "name": "Main Topic 2",
              "subtopics": [
                // ... more subtopics
              ]
            }
            // ... more topics
          ]
        }

        Identify 3-5 main topics from the text, and for each main topic, identify 2-4 key subtopics with details.

        Input Text:
        """
        ${promptText}
        """

        JSON Output:
      `;

      // ### FIX: Use 'generate' instead of 'generateWithAI' ###
      const aiResponse = await generate(
        prompt,
        'mindmap' // Tool type
      );

      // Parse and validate the AI response
      let parsedResponse;
      if (typeof aiResponse === 'string') {
        try {
          // Find the start of the JSON
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error("AI did not return valid JSON format.");
          }
          parsedResponse = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse AI response:", aiResponse);
          throw new Error('AI returned invalid JSON format.');
        }
      } else {
        parsedResponse = aiResponse; // Assume it's already an object
      }

      // Ensure the response has the structure our render function expects
      if (!parsedResponse || !parsedResponse.centralIdea || !parsedResponse.topics) {
        console.error("Invalid mind map structure:", parsedResponse);
        throw new Error('AI response is missing required mind map structure (centralIdea or topics).');
      }

      dispatch({ type: 'SET_OUTPUT', payload: parsedResponse });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate mind map: ${error.message}` });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleCopy = async () => {
    // ### FIX: Check for .centralIdea ###
    if (state.output?.centralIdea) {
      try {
        const textOutput = formatMindMapAsText(state.output);
        await navigator.clipboard.writeText(textOutput);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to copy to clipboard' });
      }
    }
  };

  const handleExportClick = () => {
    // ### FIX: Check for .centralIdea ###
    if (state.output?.centralIdea) {
      try {
        let content, filename, title;
        
        switch (selectedFormat) {
          case 'markdown':
            content = formatMindMapAsMarkdown(state.output);
            filename = 'ai-study-mindmap';
            title = 'AI Study Companion - Mind Map';
            break;
          case 'dot':
            content = formatMindMapAsDOT(state.output);
            filename = 'ai-study-mindmap';
            title = 'AI Study Companion - Mind Map';
            break;
          case 'text':
            content = formatMindMapAsText(state.output);
            filename = 'ai-study-mindmap';
            title = 'AI Study Companion - Mind Map';
            break;
          default:
            content = JSON.stringify(state.output, null, 2);
            filename = 'ai-study-mindmap';
            title = 'AI Study Companion - Mind Map';
        }
        
        handleExport(content, selectedFormat === 'dot' ? 'text' : selectedFormat, filename, title);
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Export failed: ${error.message}` });
      }
    }
  };

  const formatMindMapAsText = (mindMapData) => {
      if (!mindMapData) return '';

      let text = `Mind Map: ${mindMapData.centralIdea || 'Central Idea'}\n`;
      text += `Generated: ${new Date().toLocaleString()}\n\n`;

      // Use empty array fallback
      (mindMapData.topics || []).forEach(topic => {
        text += `📌 ${topic.name || 'Topic'}\n`;

        (topic.subtopics || []).forEach(subtopic => {
          text += `  └── ${subtopic.name || 'Subtopic'}\n`;
          text += `      └── ${subtopic.details || 'Details'}\n`;
        });

        text += '\n';
      });

      return text;
  };

  const formatMindMapAsMarkdown = (mindMapData) => {
    let markdown = `# ${mindMapData.centralIdea}\n\n`;
    markdown += `*Generated on ${new Date().toLocaleString()}*\n\n`;
    
    (mindMapData.topics || []).forEach(topic => {
      markdown += `## ${topic.name}\n`;
      (topic.subtopics || []).forEach(subtopic => {
        markdown += `- **${subtopic.name}** - ${subtopic.details}\n`;
      });
      markdown += '\n';
    });
    
    return markdown;
  };

  const formatMindMapAsDOT = (mindMapData) => {
    let dot = `digraph MindMap {\n`;
    dot += `  rankdir=TB;\n`;
    dot += `  node [shape=rectangle, style=filled, fillcolor=lightblue];\n`;
    dot += `  "${mindMapData.centralIdea}" [fillcolor=orange];\n\n`;
    
    (mindMapData.topics || []).forEach(topic => {
      dot += `  "${mindMapData.centralIdea}" -> "${topic.name}";\n`;
      (topic.subtopics || []).forEach(subtopic => {
        dot += `  "${topic.name}" -> "${subtopic.name}";\n`;
      });
    });
    
    dot += `}`;
    return dot;
  };

  const handleClear = () => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' });
    dispatch({ type: 'SET_OUTPUT', payload: null });
    setCharCount(0);
    setZoom(1);
  };

  const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));
  const resetZoom = () => setZoom(1);

  const renderMindMapVisual = () => {
      // ### FIX: Check for .centralIdea ###
      if (!state.output?.centralIdea) return null;

      const topics = state.output.topics || []; // <- fallback to empty array

      return (
        <div className="relative bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-8 border border-orange-200 overflow-auto">
          <div 
            className="flex justify-center items-start min-w-max"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
          >
            {/* Central Idea */}
            <div className="text-center mb-12">
              <div className="bg-orange-500 text-white px-6 py-4 rounded-2xl shadow-lg inline-block max-w-md mx-auto">
                <h3 className="text-xl font-bold">{state.output.centralIdea || 'Central Idea'}</h3>
              </div>

              {/* Topics */}
              <div className="flex justify-center space-x-8 mt-8">
                {topics.map((topic, index) => (
                  <div key={topic.id || index} className="flex flex-col items-center">
                    {/* Connection Line */}
                    <div className="w-px h-8 bg-gray-400 mb-2"></div>

                    {/* Topic Node */}
                    <div className="bg-red-500 text-white px-4 py-3 rounded-xl shadow-lg text-center min-w-[120px]">
                      <h4 className="font-semibold text-sm">{topic.name || `Topic ${index + 1}`}</h4>
                    </div>

                    {/* Subtopics */}
                    <div className="flex flex-col items-center mt-4 space-y-2">
                      {(topic.subtopics || []).map((subtopic, subIndex) => (
                        <div key={subtopic.id || subIndex} className="flex flex-col items-center">
                          <div className="w-px h-4 bg-gray-300 mb-1"></div>
                          <div className="bg-white border-2 border-red-300 px-3 py-2 rounded-lg shadow-sm text-center min-w-[100px]">
                            <p className="text-xs font-medium text-gray-800">{subtopic.name || 'Subtopic'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Layers className="h-5 w-5 text-orange-500" />
            <span>Generate Mind Map</span>
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
              Enter your study material {charCount > 0 && (
                <span className="text-xs text-gray-500 ml-2">({charCount} characters)</span>
              )}
            </label>
            <textarea
              value={state.inputText}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder="Paste your complex concepts, chapter summaries, or interconnected ideas to visualize as a mind map...

Example: 'Machine learning encompasses several types: supervised learning (classification, regression), unsupervised learning (clustering, dimensionality reduction), and reinforcement learning. Key algorithms include neural networks, decision trees, and support vector machines. Applications range from image recognition to natural language processing.'"
              rows={8}
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 100 characters recommended</span>
              <span>{charCount}/15000</span>
            </div>
          </div>

          <button
            onClick={generateMindMap}
            disabled={state.isLoading || !state.inputText.trim()}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layers className="h-4 w-4 mr-2" />
            {state.isLoading ? 'Generating Mind Map...' : 'Generate Mind Map'}
          </button>
        </div>
      </div>

      {/* Output Section */}
      {/* ### FIX: Check for .centralIdea to prevent crash ### */}
      {state.output?.centralIdea && (
        <div className="card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Layers className="h-5 w-5 text-orange-500" />
              <span>Generated Mind Map</span>
            </h2>
            <div className="flex items-center space-x-2">
              {/* Zoom Controls */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={zoomOut}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom Out"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={resetZoom}
                  className="p-1 rounded hover:bg-gray-200 transition-colors text-xs font-medium"
                  title="Reset Zoom"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  onClick={zoomIn}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
                  title="Zoom In"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="input-field text-sm w-32"
              >
                <option value="markdown">Markdown</option>
                <option value="dot">DOT</option>
                {/* ### FIX: Corrected typo 'value_expose' ### */}
                <option value="text">Text</option>
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

          {/* Visual Mind Map */}
          <div className="mb-6">
            {renderMindMapVisual()}
          </div>

          {/* Text Representation */}
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Text Representation</h3>
            <pre className="whitespace-pre-wrap text-gray-800 font-mono text-sm leading-relaxed">
              {formatMindMapAsText(state.output)}
            </pre>
          </div>

          {/* Usage Tips */}
          <div className="mt-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-orange-800 mb-2">🎯 How to Use This Mind Map</h3>
            <ul className="text-xs text-orange-700 space-y-1">
              <li>• Export as DOT format to visualize with Graphviz tools</li>
              <li>• Use Markdown format for note-taking apps like Obsidian</li>
              <li>• Print the text representation for offline study</li>
              <li>• Combine with flashcards for comprehensive learning</li>
            </ul>
          </div>
        </div>
      )}

      {/* Empty State */}
      {/* ### FIX: Check for .centralIdea to prevent crash ### */}
      {!state.output?.centralIdea && !state.isLoading && (
        <div className="card text-center py-12">
          <Layers className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Visualize Your Knowledge</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter your study materials above to generate an interactive mind map that shows relationships between concepts and ideas.
          </p>
        </div>
      )}
    </div>
  );
};

export default MindMapTool;