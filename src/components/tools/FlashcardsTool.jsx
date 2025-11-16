// src/components/tools/FlashcardsTool.jsx
import React, { useState } from 'react';
import { Download, Copy, Layout, RotateCcw, Shuffle, CheckCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { useAIClient } from '../../hooks/useAIClient'; // 
import { handleExport } from '../../services/exporters';
// import { sanitizeInput } from '../../utils/sanitize'; // 
import { globalRateLimiter } from '../../utils/rateLimit';

const FlashcardsTool = () => {
  const { state, dispatch } = useApp();
  const { apiKeys } = useApiKeys();
  const { generate } = useAIClient(); // 
  const [isCopied, setIsCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  // Note: flashcardCount is not yet wired up to the AI prompt,
  // but we'll leave the UI state for future improvement.
  const [flashcardCount, setFlashcardCount] = useState(10);
  const [studyMode, setStudyMode] = useState(false);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [masteredCards, setMasteredCards] = useState(new Set());

  const handleInputChange = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
    setCharCount(text.length);
  };

  // ### FIX: This is the new, correct function that calls the AI ###
  const generateFlashcards = async () => {
    // 1. --- Input Validation ---
    if (!state.inputText.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter some text to generate flashcards' });
      return;
    }
    if (state.inputText.length < 100) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter at least 100 characters for meaningful flashcards' });
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
      // We pass the raw inputText, as decided (no sanitization)
      const aiResponse = await generate(
        state.inputText, 
        'flashcards' // This must match your promptTemplates.js key
      );

      // 6. --- Parse the AI's JSON Response ---
      if (!aiResponse) {
        throw new Error("The AI returned an empty response.");
      }

      let flashcardsData;
      if (typeof aiResponse === 'object') {
        // The service already parsed the JSON
        flashcardsData = aiResponse;
      } else {
        // The AI returned a string, we need to parse it
        try {
          // Find the start of the JSON
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error("AI did not return valid JSON format.");
          }
          flashcardsData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse AI response:", aiResponse);
          throw new Error("AI returned a malformed flashcard set. Please try again.");
        }
      }

      // 7. --- Validate the JSON structure ---
      if (!flashcardsData.flashcards || !Array.isArray(flashcardsData.flashcards) || flashcardsData.flashcards.length === 0) {
        console.error("Invalid flashcard data structure:", flashcardsData);
        throw new Error("AI returned flashcard data in an unknown format.");
      }

      // 8. --- Success: Set the output ---
      dispatch({ type: 'SET_OUTPUT', payload: flashcardsData });
      
    } catch (error) {
      // 9. --- Handle Errors ---
      console.error("Flashcard generation failed:", error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate flashcards: ${error.message}` });
    } finally {
      // 10. --- Stop Loading ---
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };


  const handleCopy = async () => {
    // ### FIX: Check for .flashcards ###
    if (state.output?.flashcards) {
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
    // ### FIX: Check for .flashcards ###
    if (state.output?.flashcards) {
      try {
        const content = state.exportFormat === 'json' 
          ? JSON.stringify(state.output, null, 2)
          : formatFlashcardsAsText(state.output);
        
        handleExport(content, state.exportFormat, 'ai-study-flashcards', 'AI Study Companion - Flashcards');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Export failed: ${error.message}` });
      }
    }
  };

  const formatFlashcardsAsText = (flashcardsData) => {
    let text = `Flashcards Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Cards: ${flashcardsData.flashcards.length}\n\n`;
    
    flashcardsData.flashcards.forEach((card, index) => {
      text += `Card ${index + 1} (${card.difficulty}):\n`;
      text += `Q: ${card.question}\n`;
      text += `A: ${card.answer}\n`;
      text += `Category: ${card.category}\n\n`;
    });
    
    return text;
  };

  const handleClear = () => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' });
    dispatch({ type: 'SET_OUTPUT', payload: null });
    setCharCount(0);
    setStudyMode(false);
    setCurrentCard(0);
    setShowAnswer(false);
    setMasteredCards(new Set());
  };

  const startStudyMode = () => {
    setStudyMode(true);
    setCurrentCard(0);
    setShowAnswer(false);
    setMasteredCards(new Set());
  };

  const nextCard = () => {
    // ### FIX: Check for .flashcards ###
    if (state.output?.flashcards && currentCard < state.output.flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  const markMastered = () => {
    setMasteredCards(new Set([...masteredCards, currentCard]));
    nextCard();
  };

  const shuffleCards = () => {
    // ### FIX: Check for .flashcards ###
    if (state.output?.flashcards) {
      const shuffled = [...state.output.flashcards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      dispatch({ 
        type: 'SET_OUTPUT', 
        payload: { ...state.output, flashcards: shuffled } 
      });
      setCurrentCard(0);
      setShowAnswer(false);
    }
  };

  const currentFlashcard = state.output?.flashcards?.[currentCard];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <Layout className="h-5 w-5 text-green-500" />
            <span>Generate Flashcards</span>
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
              placeholder="Paste your textbook content, lecture notes, or any study material to generate Q&A flashcards...

Example: 'Photosynthesis is the process used by plants to convert sunlight into chemical energy. This process requires chlorophyll, carbon dioxide, water, and sunlight. The chemical equation is 6CO2 + 6H2O → C6H12O6 + 6O2.'"
              rows={8}
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 100 characters recommended</span>
              <span>{charCount}/15000</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Flashcards (AI Default)
              </label>
              <select
                value={flashcardCount}
                onChange={(e) => setFlashcardCount(parseInt(e.target.value))}
                className="input-field"
                disabled // Disabled for now, as it's not wired into the prompt
              >
                <option value="5">5 Flashcards</option>
                <option value="10">10 Flashcards</option>
                <option value="15">15 Flashcards</option>
                <option value="20">20 Flashcards</option>
              </select>
            </div>
          </div>

          <button
            onClick={generateFlashcards}
            disabled={state.isLoading || !state.inputText.trim()}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Layout className="h-4 w-4 mr-2" />
            {state.isLoading ? 'Generating Flashcards...' : 'Generate Flashcards'}
          </button>
        </div>
      </div>

      {/* Study Mode */}
      {studyMode && currentFlashcard && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Study Mode</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                Card {currentCard + 1} of {state.output.flashcards.length}
              </span>
              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Mastered: {masteredCards.size}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-8 border border-blue-200 min-h-[300px] flex flex-col justify-center">
            <div className="text-center space-y-6">
              <div className="mb-4">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  currentFlashcard.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  currentFlashcard.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentFlashcard.difficulty}
                </span>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {currentFlashcard.question}
              </h3>

              {showAnswer && (
                <div className="animate-fade-in">
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <p className="text-lg text-gray-800 leading-relaxed">
                      {currentFlashcard.answer}
                    </p>
                  </div>
                  
                  <div className="flex justify-center space-x-4 mt-6">
                    <button
                      onClick={markMastered}
                      className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>I Know This</span>
                    </button>
                  </div>
                </div>
              )}

              {!showAnswer && (
                <button
                  onClick={() => setShowAnswer(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors"
                >
                  Reveal Answer
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={prevCard}
              disabled={currentCard === 0}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={nextCard}
              disabled={!state.output?.flashcards || currentCard === state.output.flashcards.length - 1}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next Card
            </button>
          </div>
        </div>
      )}

      {/* Output Section */}
      {/* ### FIX: Check for .flashcards to prevent crash ### */}
      {state.output?.flashcards && !studyMode && (
        <div className="card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Layout className="h-5 w-5 text-green-500" />
              <span>Generated Flashcards ({state.output.flashcards.length} cards)</span>
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={shuffleCards}
                className="btn-secondary flex items-center text-sm"
              >
                <Shuffle className="h-4 w-4 mr-1" />
                Shuffle
              </button>
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

          <div className="mb-4">
            <button
              onClick={startStudyMode}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Start Study Mode
            </button>
          </div>

          <div className="grid gap-4 max-h-96 overflow-y-auto">
            {state.output.flashcards.map((card, index) => (
              <div
                key={card.id || index} // Fallback to index
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    card.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                    card.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {card.difficulty}
                  </span>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-gray-900">Q: {card.question}</p>
                  <p className="text-gray-700">A: {card.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {/* ### FIX: Check if output is NOT a flashcard object (or is null) ### */}
      {(!state.output?.flashcards) && !state.isLoading && (
        <div className="card text-center py-12">
          <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Flashcards</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter your study materials above to generate interactive Q&A flashcards. Perfect for active recall practice!
          </p>
        </div>
      )}
    </div>
  );
};

export default FlashcardsTool;