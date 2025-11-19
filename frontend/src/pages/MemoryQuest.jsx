import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const MemoryQuest = () => {
  const [cards, setCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [moves, setMoves] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [highestLevelReached, setHighestLevelReached] = useState(1); // 🔧 NEW: Track highest level
  const [theme, setTheme] = useState('');
  const [canFlip, setCanFlip] = useState(true);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  
  const { updateUserStars } = useAuth();
  const navigate = useNavigate();

  //  Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('📖 Loading saved MemoryQuest progress...');
        const { data } = await api.get('/game/memory/progress');
        
        if (data && data.currentLevel > 1) {
          console.log('✅ Found saved progress:', data);
          setSavedProgress(data);
          setHighestLevelReached(data.currentLevel); // 🔧 Initialize highest level from saved progress
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

  // Timer
  useEffect(() => {
    let interval;
    if (gameStarted && !gameOver && !levelComplete) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, gameOver, levelComplete]);

  // Check for matches
  useEffect(() => {
    if (flippedCards.length === 2) {
      setCanFlip(false);
      const [first, second] = flippedCards;
      
      if (cards[first].content === cards[second].content) {
        // Match found!
        const newMatchedCards = [...matchedCards, first, second];
        setMatchedCards(newMatchedCards);
        
        const newScore = score + 20;
        setScore(newScore);
        
        setFlippedCards([]);
        setCanFlip(true);
        
        // Check if game is complete
        if (newMatchedCards.length === cards.length) {
          console.log('🎉 All pairs matched!', {
            totalPairs: cards.length / 2,
            matchedPairs: newMatchedCards.length / 2,
            moves: moves,
            score: newScore
          });
          
          setTimeout(() => {
            handleLevelComplete(newScore, newMatchedCards.length);
          }, 500);
        }
      } else {
        // No match
        setTimeout(() => {
          setFlippedCards([]);
          setCanFlip(true);
        }, 1000);
      }
    }
  }, [flippedCards]);

  //  Save progress
  const saveProgress = async (level, diff) => {
    try {
      const nextLevel = level + 1;
      console.log('💾 Saving MemoryQuest progress:', { currentLevel: nextLevel, difficulty: diff });
      
      await api.post('/game/memory/progress', {
        currentLevel: nextLevel,
        lastDifficulty: diff,
        lastPlayed: new Date()
      });
      
      // Update highest level reached
      setHighestLevelReached(prevHighest => Math.max(prevHighest, nextLevel));
      
      console.log('✅ Progress saved! Unlocked Level', nextLevel);
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  const fetchCards = async (level = 1, diff = 'medium') => {
    try {
      console.log('📥 Fetching cards with difficulty:', diff);
      setLoading(true);
      
      const { data } = await api.get(`/game/memory/cards?difficulty=${diff}`);
      
      console.log('✅ Received cards:', {
        theme: data.theme,
        numPairs: data.numPairs,
        totalCards: data.cards.length,
        difficulty: data.difficulty
      });
      
      setCards(data.cards);
      setTheme(data.theme);
      setDifficulty(data.difficulty);
    } catch (error) {
      console.error('❌ Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (index) => {
    if (!canFlip || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    if (flippedCards.length === 0) {
      setFlippedCards([index]);
      setMoves(moves + 1);
    } else if (flippedCards.length === 1) {
      setFlippedCards([...flippedCards, index]);
      setMoves(moves + 1);
    }
  };

  const handleLevelComplete = (finalScore = score, finalMatchedCount = matchedCards.length) => {
    console.log('🎊 Level complete!', {
      currentLevel,
      finalScore,
      finalMatchedCount,
      totalPairs: cards.length / 2,
      moves
    });
    
    setLevelComplete(true);
    
    // Calculate bonus points
    const timeBonus = Math.max(0, 100 - timeElapsed);
    const moveBonus = Math.max(0, 50 - moves);
    const totalScore = finalScore + timeBonus + moveBonus;
    
    console.log('💰 Bonus calculation:', {
      baseScore: finalScore,
      timeBonus,
      moveBonus,
      totalScore
    });
    
    setScore(totalScore);
    
    // Save progress
    saveProgress(currentLevel, difficulty);
  };

  const finishGame = async () => {
    console.log('🏁 Finishing MemoryQuest...', {
      currentLevel,
      highestLevelReached,
      score,
      moves,
      matchedCards: matchedCards.length,
      totalCards: cards.length
    });
    
    setGameOver(true);
    
    try {
      const pairsFound = matchedCards.length / 2;
      const totalPairs = cards.length / 2;
      
      console.log('📤 Submitting final results to server...', {
        gameType: 'memory',
        level: highestLevelReached, //Send highest level reached, not current level
        score,
        moves,
        pairsFound,
        totalPairs,
        accuracy: `${Math.round((pairsFound / totalPairs) * 100)}%`
      });
      
      //  Send highest level reached to ensure dashboard updates correctly
      const { data } = await api.post('/game/result', {
        gameType: 'memory',
        score: score,
        questionsAnswered: moves,
        correctAnswers: pairsFound,
        level: highestLevelReached //  Use highest level, not current level
      });
      
      console.log('✅ Results submitted:', data);
      
      if (data && data.totalStars !== undefined) {
        updateUserStars(data.totalStars);
        console.log('⭐ Stars updated:', data.totalStars);
      }
      
    } catch (error) {
      console.error('❌ Error submitting result:', error);
    }
  };

  const startGame = async (level = 1, diff = 'medium') => {
    console.log('☢️ NUCLEAR START - MemoryQuest:', { level, difficulty: diff });
    
    setTransitioning(true);
    
    setCurrentLevel(level);
    setDifficulty(diff);
    setGameStarted(false);
    setGameOver(false);
    setLevelComplete(false);
    setCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setMoves(0);
    setTimeElapsed(0);
    setScore(0);
    setCanFlip(true);
    setTheme('');
    
    setTimeout(async () => {
      console.log('✅ Phase 1 - Enabling game');
      setGameStarted(true);
      setTransitioning(false);
      
      setTimeout(async () => {
        console.log('✅ Phase 2 - Fetching cards for level', level);
        await fetchCards(level, diff);
      }, 100);
    }, 300);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCardFlipped = (index) => {
    return flippedCards.includes(index) || matchedCards.includes(index);
  };

  const getCardCount = (diff) => {
    switch(diff) {
      case 'easy': return 12;
      case 'medium': return 16;
      case 'hard': return 20;
      default: return 16;
    }
  };

  if (transitioning) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6 animate-spin">⏳</div>
          <h2 className="text-3xl font-bold text-purple-600 mb-2">
            Preparing Level {currentLevel}...
          </h2>
          <p className="text-gray-600">Shuffling cards for you!</p>
        </motion.div>
      </div>
    );
  }

  if (loadingProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6 animate-pulse">🧠</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loading your progress...
          </h2>
          <p className="text-gray-600">Just a moment!</p>
        </motion.div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-2xl"
        >
          <div className="text-7xl mb-6">🧠</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">MemoryQuest</h1>
          <p className="text-gray-600 text-lg mb-8">
            Flip cards and find matching pairs! Train your memory and concentration skills.
          </p>

          {savedProgress && savedProgress.currentLevel > 1 && (
            <div className="mb-6 p-4 bg-purple-50 border-2 border-purple-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                <span className="text-2xl">💾</span>
                <p className="text-purple-800 font-bold">Progress Found!</p>
              </div>
              <p className="text-purple-700 text-sm">
                You're on Level {savedProgress.currentLevel} ({savedProgress.lastDifficulty || 'medium'})
              </p>
              <p className="text-purple-600 text-xs mt-1">
                Last played: {new Date(savedProgress.lastPlayed).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {savedProgress && savedProgress.currentLevel > 1 && (
            <button
              onClick={() => startGame(savedProgress.currentLevel, savedProgress.lastDifficulty || 'medium')}
              className="w-full mb-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-purple-600 hover:to-purple-700 transition shadow-lg"
            >
              ▶️ Continue (Level {savedProgress.currentLevel} - {savedProgress.lastDifficulty || 'medium'})
            </button>
          )}
          
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              {savedProgress && savedProgress.currentLevel > 1 ? 'Or Start New Game:' : 'Choose Difficulty:'}
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => startGame(1, 'easy')}
                className="bg-gradient-to-r from-green-400 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-500 hover:to-green-700 transition shadow-lg"
              >
                <div className="text-3xl mb-2">😊</div>
                <div>Easy</div>
                <div className="text-sm opacity-80">{getCardCount('easy')} Cards</div>
              </button>
              
              <button
                onClick={() => startGame(1, 'medium')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition shadow-lg"
              >
                <div className="text-3xl mb-2">🤔</div>
                <div>Medium</div>
                <div className="text-sm opacity-80">{getCardCount('medium')} Cards</div>
              </button>
              
              <button
                onClick={() => startGame(1, 'hard')}
                className="bg-gradient-to-r from-red-500 to-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition shadow-lg"
              >
                <div className="text-3xl mb-2">🔥</div>
                <div>Hard</div>
                <div className="text-sm opacity-80">{getCardCount('hard')} Cards</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (levelComplete && !gameOver) {
    const accuracy = cards.length > 0 ? Math.round((matchedCards.length / cards.length) * 100) : 0;
    
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🎊</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Level {currentLevel} Complete!</h1>
          
          <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">💾</span>
              <p className="text-purple-700 font-semibold text-sm">Progress Saved!</p>
            </div>
            <p className="text-purple-600 text-xs mt-1">
              Next time you'll start on Level {currentLevel + 1}
            </p>
          </div>
          
          <div className="space-y-4 mb-8">
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Score This Level</p>
              <p className="text-3xl font-bold text-purple-600">{score} ⭐</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Time</p>
                <p className="text-2xl font-bold text-blue-600">{formatTime(timeElapsed)}</p>
              </div>
              
              <div className="bg-green-100 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">Moves</p>
                <p className="text-2xl font-bold text-green-600">{moves}</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setLevelComplete(false);
                setTimeout(() => startGame(currentLevel, difficulty), 250);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition"
            >
              🔄 Replay Level {currentLevel} ({difficulty})
            </button>
            <button
              onClick={() => {
                const nextDiff = difficulty === 'easy' ? 'medium' : difficulty === 'medium' ? 'hard' : 'hard';
                setLevelComplete(false);
                setTimeout(() => startGame(currentLevel + 1, nextDiff), 250);
              }}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition"
            >
              ➡️ Next Challenge (Level {currentLevel + 1})
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

  if (gameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Great Memory!</h1>
          
          <div className="space-y-4 mb-8">
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Total Score</p>
              <p className="text-3xl font-bold text-purple-600">{score} ⭐</p>
            </div>
            
            {/* Show highest level reached */}
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Highest Level Reached</p>
              <p className="text-3xl font-bold text-green-600">Level {highestLevelReached}</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setGameOver(false);
                startGame(1, 'medium');
              }}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-purple-700 transition"
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

  const gridCols = cards.length === 12 ? 'grid-cols-4' : cards.length === 16 ? 'grid-cols-4' : 'grid-cols-5';

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-4xl">🧠</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">MemoryQuest - Level {currentLevel}</h2>
                <p className="text-gray-600">{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} Mode</p>
                <p className="text-sm text-purple-600">Theme: {theme}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <p className="text-gray-600 text-sm">Time</p>
                <p className="text-2xl font-bold text-blue-600">{formatTime(timeElapsed)}</p>
              </div>
              
              <div className="text-center">
                <p className="text-gray-600 text-sm">Moves</p>
                <p className="text-2xl font-bold text-green-600">{moves}</p>
              </div>
              
              <div className="bg-yellow-100 px-6 py-3 rounded-full">
                <p className="text-sm text-gray-600">Score</p>
                <p className="text-2xl font-bold text-yellow-600">{score} ⭐</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600 text-xl">Loading cards...</p>
          </div>
        ) : (
          <div className={`grid ${gridCols} gap-4`}>
            <AnimatePresence>
              {cards.map((card, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="aspect-square"
                >
                  <div
                    className={`relative w-full h-full cursor-pointer ${
                      !canFlip && !isCardFlipped(index) ? 'cursor-not-allowed' : ''
                    }`}
                    onClick={() => handleCardClick(index)}
                  >
                    <div
                      className={`absolute w-full h-full transition-transform duration-500 transform-style-3d ${
                        isCardFlipped(index) ? 'rotate-y-180' : ''
                      }`}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      <div
                        className="absolute w-full h-full bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl shadow-xl flex items-center justify-center backface-hidden"
                        style={{ backfaceVisibility: 'hidden' }}
                      >
                        <span className="text-6xl">🎴</span>
                      </div>
                      
                      <div
                        className="absolute w-full h-full bg-white rounded-2xl shadow-xl flex items-center justify-center rotate-y-180 backface-hidden border-4 border-purple-200"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <span className="text-6xl">{card.content}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <div className="mt-8 bg-white rounded-2xl shadow-xl p-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-semibold">Progress</span>
            <span className="text-gray-700 font-bold">
              {matchedCards.length / 2} / {cards.length / 2} Pairs Found
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${(matchedCards.length / cards.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <style jsx>{`
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default MemoryQuest;