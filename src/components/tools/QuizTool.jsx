// src/components/tools/QuizTool.jsx
import React, { useState } from 'react';
import { Download, Copy, HelpCircle, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { useApiKeys } from '../../hooks/useApiKeys';
import { useAIClient } from '../../hooks/useAIClient'; // 
import { handleExport } from '../../services/exporters';
import { globalRateLimiter } from '../../utils/rateLimit';

const QuizTool = () => {
  const { state, dispatch } = useApp();
  const { apiKeys } = useApiKeys(); // Keep this for API key check
  const { generate } = useAIClient(); // Get the AI function from our hook
  const [isCopied, setIsCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [quizMode, setQuizMode] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleInputChange = (text) => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: text });
    setCharCount(text.length);
  };

  // ### FIX: This is the new, correct function that calls the AI ###
  const generateQuiz = async () => {
    // 1. --- Input Validation ---
    if (!state.inputText.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter some text to generate a quiz' });
      return;
    }
    if (state.inputText.length < 150) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter at least 150 characters for a meaningful quiz' });
      return;
    }

    // --- API Key Check (from original logic) ---
    const apiKey = apiKeys[state.currentProvider];
    if (!apiKey) {
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Please add your ${state.currentProvider} API key in settings to use this tool` 
      });
      return;
    }

    // 2. --- Rate Limiting ---
    const userId = 'user'; // You might want to make this more specific
    if (!globalRateLimiter.checkLimit(userId)) {
      const remaining = globalRateLimiter.getRemainingRequests(userId);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: `Rate limit exceeded. Please wait a minute. ${remaining} requests remaining.` 
      });
      return;
    }

    // 3. --- Set Loading State ---
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_OUTPUT', payload: null }); // Clear old results

    try {
      // 4. --- Call the AI Service ---
      // We pass the raw inputText, as decided (no sanitization)
      const aiResponse = await generate(
        state.inputText, 
        'quiz', // This must match your promptTemplates.js key
      );

      // 5. --- Parse the AI's JSON Response ---
      if (!aiResponse) {
        throw new Error("The AI returned an empty response.");
      }

      let quizData;
      if (typeof aiResponse === 'object') {
        // The service already parsed the JSON
        quizData = aiResponse;
      } else {
        // The AI returned a string, we need to parse it
        try {
          // Find the start of the JSON
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (!jsonMatch) {
            throw new Error("AI did not return valid JSON format.");
          }
          quizData = JSON.parse(jsonMatch[0]);
        } catch (parseError) {
          console.error("Failed to parse AI response:", aiResponse);
          throw new Error("AI returned a malformed quiz. Please try again.");
        }
      }

      // 6. --- Validate the JSON structure ---
      if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
        console.error("Invalid quiz data structure:", quizData);
        throw new Error("AI returned quiz data in an unknown format.");
      }

      // 7. --- Success: Set the output ---
      dispatch({ type: 'SET_OUTPUT', payload: quizData });

    } catch (error) {
      // 8. --- Handle Errors ---
      console.error("Quiz generation failed:", error);
      dispatch({ type: 'SET_ERROR', payload: `Failed to generate quiz: ${error.message}` });
    } finally {
      // 9. --- Stop Loading ---
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const handleCopy = async () => {
    if (state.output?.questions) { // 
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
    // ### FIX: Check for .questions to prevent crash ###
    if (state.output?.questions) {
      try {
        const content = state.exportFormat === 'json' 
          ? JSON.stringify(state.output, null, 2)
          : formatQuizAsText(state.output);
        
        handleExport(content, state.exportFormat, 'ai-study-quiz', 'AI Study Companion - Quiz');
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: `Export failed: ${error.message}` });
      }
    }
  };

  const formatQuizAsText = (quizData) => {
    let text = `Quiz Generated: ${new Date().toLocaleString()}\n`;
    text += `Total Questions: ${quizData.questions.length}\n\n`;
    
    quizData.questions.forEach((question, index) => {
      text += `Question ${index + 1}:\n`;
      text += `${question.question}\n\n`;
      question.options.forEach((option, optIndex) => {
        text += `${String.fromCharCode(65 + optIndex)}) ${option}\n`;
      });
      text += `\nCorrect Answer: ${question.correctAnswer}\n`;
      text += `Explanation: ${question.explanation}\n\n`;
    });
    
    return text;
  };

  const handleClear = () => {
    dispatch({ type: 'SET_INPUT_TEXT', payload: '' });
    dispatch({ type: 'SET_OUTPUT', payload: null });
    setCharCount(0);
    setQuizMode(false);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const startQuiz = () => {
    setQuizMode(true);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    if (answer === currentQuestionData.correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < state.output.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const currentQuestionData = state.output?.questions?.[currentQuestion];

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <HelpCircle className="h-5 w-5 text-purple-500" />
            <span>Generate Quiz</span>
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
              placeholder="Paste your textbook content, lecture notes, or any study material to generate a multiple-choice quiz...

Example: 'The human brain consists of several major parts: the cerebrum, cerebellum, and brainstem. The cerebrum is responsible for higher functions like thinking and decision-making. The cerebellum coordinates movement and balance. The brainstem controls basic life functions like breathing and heart rate.'"
              rows={8}
              className="input-field resize-none font-mono text-sm"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Minimum 150 characters recommended</span>
              <span>{charCount}/20000</span>
            </div>
          </div>

          <button
            onClick={generateQuiz}
            disabled={state.isLoading || !state.inputText.trim()}
            className="btn-primary w-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            {state.isLoading ? 'Generating Quiz...' : 'Generate Quiz (7 Questions)'}
          </button>
        </div>
      </div>

      {/* Quiz Mode */}
      {quizMode && currentQuestionData && !quizCompleted && (
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Quiz Mode</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Question {currentQuestion + 1} of {state.output.questions.length}
              </span>
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Score: {score}
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl p-8 border border-purple-200">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900 text-center">
                {currentQuestionData.question}
              </h3>

              <div className="grid gap-3">
                {currentQuestionData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => !selectedAnswer && handleAnswerSelect(option)}
                    disabled={!!selectedAnswer}
                    className={`p-4 text-left rounded-lg border-2 transition-all ${
                      !selectedAnswer
                        ? 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 cursor-pointer'
                        : option === currentQuestionData.correctAnswer
                        ? 'border-green-500 bg-green-50'
                        : option === selectedAnswer && option !== currentQuestionData.correctAnswer
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium ${
                        !selectedAnswer
                          ? 'border-gray-300 text-gray-600'
                          : option === currentQuestionData.correctAnswer
                          ? 'border-green-500 bg-green-500 text-white'
                          : option === selectedAnswer && option !== currentQuestionData.correctAnswer
                          ? 'border-red-500 bg-red-500 text-white'
                          : 'border-gray-300 text-gray-600'
                      }`}>\
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="text-lg">{option}</span>
                    </div>
                  </button>
                ))}
              </div>

              {selectedAnswer && (
                <div className="animate-fade-in">
                  <div className={`p-4 rounded-lg ${
                    selectedAnswer === currentQuestionData.correctAnswer
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2 mb-2">
                      {selectedAnswer === currentQuestionData.correctAnswer ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className={`font-medium ${
                        selectedAnswer === currentQuestionData.correctAnswer ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {selectedAnswer === currentQuestionData.correctAnswer ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    <p className="text-gray-700">{currentQuestionData.explanation}</p>
                  </div>
                  
                  <button
                    onClick={nextQuestion}
                    className="w-full mt-4 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                  >
                    {currentQuestion < state.output.questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Results */}
      {/* ### FIX: Check for .questions to prevent crash ### */}
      {quizCompleted && state.output?.questions && (
        <div className="card animate-fade-in">
          <div className="text-center py-8">
            <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
              score >= state.output.questions.length * 0.7 ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              {score >= state.output.questions.length * 0.7 ? (
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              ) : (
                <HelpCircle className="h-10 w-10 text-yellow-600" />
              )}
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Completed!</h2>
            <p className="text-lg text-gray-600 mb-6">
              You scored {score} out of {state.output.questions.length} questions
            </p>
            
            <div className="bg-gray-50 rounded-lg p-6 max-w-md mx-auto">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Correct Answers:</span>
                  <span className="font-medium">{score}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Questions:</span>
                  <span className="font-medium">{state.output.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Percentage:</span>
                  <span className="font-medium">{Math.round((score / state.output.questions.length) * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance:</span>
                  <span className={`font-medium ${
                    score >= state.output.questions.length * 0.7 ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {score >= state.output.questions.length * 0.7 ? 'Excellent!' : 'Keep Practicing!'}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={startQuiz}
              className="mt-6 bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      )}

      {/* Output Section */}
      {/* ### FIX: Check for .questions to prevent crash ### */}
      {state.output?.questions && !quizMode && (
        <div className="card animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <HelpCircle className="h-5 w-5 text-purple-500" />
              <span>Generated Quiz ({state.output.questions.length} questions)</span>
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

          <div className="mb-4">
            <button
              onClick={startQuiz}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-3 rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Start Interactive Quiz
            </button>
          </div>

          <div className="space-y-6 max-h-96 overflow-y-auto">
            {state.output.questions.map((question, index) => (
              <div
                key={question.id || index} // Fallback to index if id isn't provided
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Question {index + 1}
                  </h3>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>
                
                <p className="text-gray-800 mb-4 font-medium">{question.question}</p>
                
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded border ${
                        option === question.correctAnswer
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-600">
                          {String.fromCharCode(65 + optIndex)}
                        </span>
                        <span>{option}</span>
                        {option === question.correctAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Explanation:</strong> {question.explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {/* ### FIX: Check for .questions to prevent crash ### */}
      {!state.output?.questions && !state.isLoading && (
        <div className="card text-center py-12">
          <HelpCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready for Quiz</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Enter your study materials above to generate interactive multiple-choice questions. Test your knowledge and track your progress!
          </p>
        </div>
      )}
    </div>
  );
};

export default QuizTool;