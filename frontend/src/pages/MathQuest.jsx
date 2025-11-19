import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Timer from '../components/Timer';

const MathQuest = () => {
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  
  const { updateUserStars } = useAuth();
  const navigate = useNavigate();

  //  Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('📖 Loading saved MathQuest progress...');
        const { data } = await api.get('/game/math/progress');
        
        if (data && data.currentLevel > 1) {
          console.log('✅ Found saved progress:', data);
          setSavedProgress(data);
        } else {
          console.log('ℹ️ No saved progress found');
        }
      } catch (error) {
        console.error('❌ Error loading progress:', error);
      } finally {
        setLoadingProgress(false);
      }
    };

    loadProgress();
  }, []);

  //  Save progress
  const saveProgress = async (level) => {
    try {
      console.log('💾 Saving MathQuest progress for level:', level);
      await api.post('/game/math/progress', {
        currentLevel: level + 1,
        lastPlayed: new Date()
      });
      console.log('✅ Progress saved!');
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  //  Submit level results to update dashboard stats
  const submitLevelResults = async (levelScore, levelQuestions, levelCorrect) => {
    try {
      console.log('📊 Submitting MathQuest level results...', { 
        level: currentLevel, 
        levelScore, 
        levelQuestions, 
        levelCorrect 
      });
      
      const { data } = await api.post('/game/result', {
        gameType: 'math',
        score: levelScore,
        questionsAnswered: levelQuestions,
        correctAnswers: levelCorrect
      });
      
      console.log('✅ Level results submitted:', data);
      
      if (data && data.totalStars !== undefined) {
        updateUserStars(data.totalStars);
        console.log('⭐ Stars updated:', data.totalStars);
      }
      
    } catch (error) {
      console.error('❌ Error submitting level results:', error);
    }
  };

  //  Simple question fetching
  const fetchQuestion = async () => {
    try {
      console.log('📥 Fetching math question...');
      setLoading(true);
      setFeedback('');
      setAnswer('');
      setIsProcessing(false);
      
      const { data } = await api.get('/game/math/question');
      console.log('📦 Received question:', data.question);
      
      setQuestion(data);
      setLoading(false);
      
      console.log('✅ Question loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching question:', error);
      setLoading(false);
      
      // Retry once
      setTimeout(() => {
        fetchQuestion();
      }, 1000);
    }
  };

  // Generate visual representation of the math problem
  const generateVisual = (questionData) => {
    if (!questionData) return null;

    const parts = questionData.question.split(' ');
    const num1 = parseInt(parts[0]);
    const operation = parts[1];
    const num2 = parseInt(parts[2]);

    const maxVisual = 15;

    if (operation === '+') {
      if (num1 <= maxVisual && num2 <= maxVisual) {
        return (
          <div className="flex flex-col items-center space-y-4 my-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-4 rounded-xl">
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(num1)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  ))}
                </div>
              </div>
              
              <span className="text-4xl font-bold text-white">+</span>
              
              <div className="bg-green-100 p-4 rounded-xl">
                <div className="grid grid-cols-5 gap-2">
                  {[...Array(num2)].map((_, i) => (
                    <div key={i} className="w-6 h-6 bg-green-500 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-white/80 text-sm">Count all the circles!</p>
          </div>
        );
      }
    } else if (operation === '-') {
      if (num1 <= maxVisual) {
        return (
          <div className="flex flex-col items-center space-y-4 my-6">
            <div className="bg-yellow-100 p-4 rounded-xl">
              <div className="grid grid-cols-5 gap-2">
                {[...Array(num1)].map((_, i) => (
                  <div key={i} className="relative w-6 h-6">
                    <div className="w-6 h-6 bg-yellow-500 rounded-full"></div>
                    {i < num2 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-0.5 bg-red-600 rotate-45"></div>
                        <div className="w-8 h-0.5 bg-red-600 -rotate-45 absolute"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/80 text-sm">Count the circles that are NOT crossed out!</p>
          </div>
        );
      }
    } else if (operation === '*') {
      if (num1 <= 10 && num2 <= 10) {
        return (
          <div className="flex flex-col items-center space-y-4 my-6">
            <div className="bg-purple-100 p-4 rounded-xl">
              <div className="flex gap-4">
                {[...Array(num1)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    {[...Array(num2)].map((_, j) => (
                      <div key={j} className="w-6 h-6 bg-purple-500 rounded"></div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <p className="text-white/80 text-sm">{num1} groups of {num2} squares</p>
          </div>
        );
      }
    }

    return (
      <div className="my-6 bg-white/10 backdrop-blur-sm p-4 rounded-xl">
        <p className="text-white text-center">
          {operation === '+' && `💡 Tip: Add ${num1} + ${num2}`}
          {operation === '-' && `💡 Tip: Start at ${num1}, count back ${num2}`}
          {operation === '*' && `💡 Tip: ${num1} groups of ${num2}, or ${num1} × ${num2}`}
        </p>
      </div>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('📝 Submit attempt');
    
    if (isProcessing || feedback) {
      console.log('⛔ Submit blocked');
      return;
    }
    
    setIsProcessing(true);
    
    const userAnswer = parseInt(answer);
    const isCorrect = userAnswer === question.answer;
    
    console.log('🎯 Answer check:', { userAnswer, correctAnswer: question.answer, isCorrect });
    
    // Calculate new values
    const newScore = isCorrect ? score + 10 : score;
    const newCorrectAnswers = isCorrect ? correctAnswers + 1 : correctAnswers;
    const newQuestionsAnswered = questionsAnswered + 1;
    
    // Update states
    if (isCorrect) {
      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);
      setFeedback('✅ Correct! Great job!');
    } else {
      setFeedback(`❌ Wrong! The answer was ${question.answer}`);
    }
    
    setQuestionsAnswered(newQuestionsAnswered);
    
    console.log('📊 Progress:', { 
      questionsAnswered: newQuestionsAnswered, 
      score: newScore, 
      correctAnswers: newCorrectAnswers 
    });
    
    // Check if level complete (10 questions = indices 0-9, so check when we hit 10)
    if (newQuestionsAnswered >= 10) {
      console.log('🎊 Level complete! All 10 questions answered');
      setTimeout(() => {
        setLevelComplete(true);
        setIsProcessing(false);
        
        // Save progress
        saveProgress(currentLevel);
        
        // Submit level results
        submitLevelResults(newScore, newQuestionsAnswered, newCorrectAnswers);
      }, 1500);
    } else {
      console.log('⏭️ Moving to next question:', newQuestionsAnswered + 1, 'of 10');
      setTimeout(() => {
        setIsProcessing(false);
        fetchQuestion();
      }, 1500);
    }
  };

  const finishGame = async () => {
    console.log('🏁 Finishing MathQuest...', { score, questionsAnswered, correctAnswers });
    
    setGameOver(true);
    
    try {
      const { data } = await api.post('/game/result', {
        gameType: 'math',
        score: score,
        questionsAnswered: questionsAnswered,
        correctAnswers: correctAnswers
      });
      
      console.log('✅ Results submitted:', data);
      
      if (data && data.totalStars !== undefined) {
        updateUserStars(data.totalStars);
        console.log('⭐ Stars updated:', data.totalStars);
      }
      
      // Navigate to dashboard
      setTimeout(() => {
        console.log('🏠 Navigating to dashboard...');
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('❌ Error submitting result:', error);
      // Navigate anyway
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  };

  //   Forces complete reset
  const startGame = (level = 1) => {
    console.log('☢️ NUCLEAR START - MathQuest Level:', level);
    
    // Step 1: Show transition screen
    setTransitioning(true);
    
    // Step 2: Clear everything
    setCurrentLevel(level);
    setGameStarted(false);
    setScore(0);
    setQuestionsAnswered(0);
    setCorrectAnswers(0);
    setGameOver(false);
    setLevelComplete(false);
    setQuestion(null);
    setAnswer('');
    setFeedback('');
    setIsProcessing(false);
    setLoading(false);
    
    // Step 3: Wait, then enable game
    setTimeout(() => {
      console.log('✅ Phase 1 - Enabling game');
      setGameStarted(true);
      setTransitioning(false);
      
      // Step 4: Wait, then fetch first question
      setTimeout(() => {
        console.log('✅ Phase 2 - Fetching first question');
        fetchQuestion();
      }, 100);
    }, 300);
  };

  const handleTimeUp = () => {
    console.log('⏰ Time up!');
    
    if (isProcessing || feedback) {
      console.log('⛔ Time up blocked - already processing');
      return;
    }
    
    setIsProcessing(true);
    setFeedback('⏰ Time\'s up!');
    
    const newQuestionsAnswered = questionsAnswered + 1;
    setQuestionsAnswered(newQuestionsAnswered);
    
    console.log('📊 Progress after timeout:', { 
      questionsAnswered: newQuestionsAnswered 
    });
    
    // Check if level complete
    if (newQuestionsAnswered >= 10) {
      console.log('🎊 Level complete! All 10 questions done (with timeout)');
      setTimeout(() => {
        setLevelComplete(true);
        setIsProcessing(false);
        
        // Save progress
        saveProgress(currentLevel);
        
        // Submit level results
        submitLevelResults(score, newQuestionsAnswered, correctAnswers);
      }, 1500);
    } else {
      console.log('⏭️ Moving to next question after timeout:', newQuestionsAnswered + 1, 'of 10');
      setTimeout(() => {
        setIsProcessing(false);
        setFeedback('');
        fetchQuestion();
      }, 1500);
    }
  };

  // Show transition screen
  if (transitioning) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6 animate-spin">⏳</div>
          <h2 className="text-3xl font-bold text-teal-600 mb-2">
            Preparing Level {currentLevel}...
          </h2>
          <p className="text-gray-600">Getting your math problems ready!</p>
        </motion.div>
      </div>
    );
  }

  //  Loading progress screen
  if (loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6 animate-pulse">🧮</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading your progress...
          </h2>
          <p className="text-gray-600">Just a moment!</p>
        </motion.div>
      </div>
    );
  }

  // Start Screen with Continue Option
  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🧮</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">MathQuest</h1>
          <p className="text-gray-600 text-lg mb-8">
            Solve 10 math problems as fast as you can! Each correct answer earns you 10 stars. Visual helpers included!
          </p>

          {savedProgress && savedProgress.currentLevel > 1 && (
            <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">💾</span>
                <p className="text-green-800 font-bold">Progress Found!</p>
              </div>
              <p className="text-green-700 text-sm">
                You're on Level {savedProgress.currentLevel}
              </p>
              <p className="text-green-600 text-xs mt-1">
                Last played: {new Date(savedProgress.lastPlayed).toLocaleDateString()}
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            {savedProgress && savedProgress.currentLevel > 1 && (
              <button
                onClick={() => startGame(savedProgress.currentLevel)}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
              >
                ▶️ Continue (Level {savedProgress.currentLevel})
              </button>
            )}

            <button
              onClick={() => startGame(1)}
              className={`w-full ${
                savedProgress && savedProgress.currentLevel > 1
                  ? 'bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600'
                  : 'bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800'
              } text-white px-12 py-4 rounded-xl text-xl font-semibold transition shadow-lg`}
            >
              {savedProgress && savedProgress.currentLevel > 1 
                ? '🔄 Start from Level 1' 
                : 'Start Level 1 🚀'
              }
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Level Complete Screen
  if (levelComplete && !gameOver) {
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🎊</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Level {currentLevel} Complete!</h1>
          
          <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">💾</span>
              <p className="text-green-700 font-semibold text-sm">Progress Saved!</p>
            </div>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Score This Level</p>
              <p className="text-3xl font-bold text-blue-600">{score} ⭐</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Accuracy</p>
              <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
            </div>
            
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Questions Answered</p>
              <p className="text-3xl font-bold text-purple-600">{questionsAnswered}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setLevelComplete(false);
                setTimeout(() => startGame(currentLevel), 250);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition"
            >
              🔄 Replay Level {currentLevel}
            </button>
            <button
              onClick={() => {
                setLevelComplete(false);
                setTimeout(() => startGame(currentLevel + 1), 250);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition"
            >
              ➡️ Next Level (Level {currentLevel + 1})
            </button>
            <button
              onClick={finishGame}
              className="w-full bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              🏁 Finish & Go to Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Game Over Screen
  if (gameOver) {
    const accuracy = questionsAnswered > 0 ? Math.round((correctAnswers / questionsAnswered) * 100) : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Great Job!</h1>
          
          <div className="space-y-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Total Score</p>
              <p className="text-3xl font-bold text-blue-600">{score} ⭐</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Accuracy</p>
              <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
            </div>
            
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Correct Answers</p>
              <p className="text-3xl font-bold text-purple-600">
                {correctAnswers} / {questionsAnswered}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setGameOver(false);
                startGame(1);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-800 transition"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              View Dashboard
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Main Game Screen
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-4xl">🧮</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">MathQuest - Level {currentLevel}</h2>
              <p className="text-gray-600">Question {questionsAnswered + 1} of 10</p>
            </div>
          </div>
          <div className="bg-yellow-100 px-6 py-3 rounded-full">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-2xl font-bold text-yellow-600">{score} ⭐</p>
          </div>
        </div>

        <div className="mb-8">
          <Timer 
            key={questionsAnswered}
            duration={30} 
            onTimeUp={handleTimeUp} 
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Loading question...</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-8 mb-6 text-center">
              <p className="text-white text-6xl font-bold mb-4">
                {question?.question}
              </p>
              <p className="text-white/80 text-lg mb-2">What's the answer?</p>
              
              {generateVisual(question)}
            </div>

            {feedback && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-center text-2xl font-bold mb-6 p-4 rounded-lg ${
                  feedback.includes('✅') 
                    ? 'bg-green-100 text-green-600' 
                    : 'bg-red-100 text-red-600'
                }`}
              >
                {feedback}
              </motion.div>
            )}

            {!feedback && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="number"
                  value={answer}
                  onChange={(e) => {
                    if (!isProcessing && !feedback) {
                      setAnswer(e.target.value);
                    }
                  }}
                  className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your answer..."
                  autoFocus
                  required
                  disabled={isProcessing || !!feedback}
                />
                <button
                  type="submit"
                  disabled={!answer || isProcessing}
                  className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Submit Answer
                </button>
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default MathQuest;