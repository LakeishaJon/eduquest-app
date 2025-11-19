import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Timer from '../components/Timer';

const WordQuest = () => {
  const [question, setQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [typedAnswer, setTypedAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  
  // Level stats (reset each level)
  const [levelQuestionsAnswered, setLevelQuestionsAnswered] = useState(0);
  const [levelCorrectAnswers, setLevelCorrectAnswers] = useState(0);
  const [levelScore, setLevelScore] = useState(0);
  
  const [feedback, setFeedback] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [levelComplete, setLevelComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [usedWords, setUsedWords] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameMode, setGameMode] = useState('scramble');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [transitioning, setTransitioning] = useState(false);
  const [questionKey, setQuestionKey] = useState(0);
  const [savedProgress, setSavedProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  
  const { updateUserStars } = useAuth();
  const navigate = useNavigate();

  const clearAllBlockingStates = () => {
    console.log('🧹 Clearing all blocking states');
    setIsProcessing(false);
    setFeedback('');
    setSelectedAnswer('');
    setTypedAnswer('');
    setLoading(false);
    stopSpeaking();
  };

  //  Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      try {
        console.log('📖 Loading saved progress...');
        const { data } = await api.get('/game/word/progress');
        
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

  //  Save progress AND update dashboard level
  const saveProgressAndUpdateLevel = async (level) => {
    try {
      console.log('💾 Saving progress for level:', level);
      console.log('📊 Updating dashboard level to:', level + 1);
      
      // Save progress (for continue feature)
      await api.post('/game/word/progress', {
        currentLevel: level + 1,
        lastPlayed: new Date()
      });
      
      // Update dashboard level (real-time level update)
      // This only updates the level, NOT the score/questions
      await api.post('/game/level-update', {
        gameType: 'word',
        level: level + 1
      });
      
      console.log('✅ Progress saved and dashboard level updated!');
    } catch (error) {
      console.error('❌ Error saving progress:', error);
    }
  };

  const scrambleWord = (word) => {
    const letters = word.split('');
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join('');
    return scrambled !== word ? scrambled : scrambleWord(word);
  };

  const generateFillBlank = (word) => {
    const wordArray = word.split('');
    const numBlanks = Math.min(Math.ceil(word.length / 2), 3);
    const blankIndices = [];
    
    while (blankIndices.length < numBlanks) {
      const randomIndex = Math.floor(Math.random() * word.length);
      if (!blankIndices.includes(randomIndex)) {
        blankIndices.push(randomIndex);
      }
    }
    
    const displayWord = wordArray.map((letter, index) => 
      blankIndices.includes(index) ? '_' : letter
    ).join(' ');
    
    return {
      display: displayWord,
      blanks: blankIndices.length,
      missingLetters: blankIndices.map(i => wordArray[i])
    };
  };

  const generateOptions = (correctWord, allWords) => {
    const wrongWords = allWords.filter(w => w !== correctWord);
    const shuffled = wrongWords.sort(() => Math.random() - 0.5);
    const options = [correctWord, ...shuffled.slice(0, 3)];
    return options.sort(() => Math.random() - 0.5);
  };

  const fetchQuestion = async (showLoading = true, duplicateRetries = 0) => {
    if (transitioning) {
      console.log('⚠️ Transitioning - skipping fetch');
      return;
    }
    
    if (duplicateRetries > 3) {
      console.error('❌ Too many duplicate words, clearing used words list');
      setUsedWords([]);
      duplicateRetries = 0;
    }

    try {
      console.log('📥 Fetching new question');
      
      if (showLoading) {
        setLoading(true);
      }
      
      setFeedback('');
      setSelectedAnswer('');
      setTypedAnswer('');
      setIsProcessing(false);
      
      const { data } = await api.get('/game/word/question');
      console.log('📦 Received word:', data.word);
      
      if (usedWords.includes(data.word)) {
        console.log('⏭️ Duplicate word detected, fetching another (retry', duplicateRetries + 1, ')');
        setLoading(false);
        await fetchQuestion(false, duplicateRetries + 1);
        return;
      }
      
      setUsedWords(prev => [...prev, data.word]);
      
      const similarWords = generateSimilarWords(data.word);
      const opts = generateOptions(data.word, similarWords);
      const mode = Math.random() < 0.5 ? 'scramble' : 'fillBlank';
      const fillBlank = generateFillBlank(data.word);
      
      console.log('🎲 Game mode:', mode);
      
      setGameMode(mode);
      setOptions(opts);
      setQuestion({
        ...data,
        scrambled: scrambleWord(data.word),
        fillBlank: fillBlank
      });
      
      setLoading(false);
      setIsProcessing(false);
      
      console.log('✅ Question loaded successfully');
      
      if (gameStarted && !gameOver && !levelComplete && !transitioning) {
        setTimeout(() => {
          console.log('🔊 Speaking word:', data.word);
          speakWord(data.word);
        }, 500);
      }
      
    } catch (error) {
      console.error('❌ Error fetching question:', error);
      setLoading(false);
      setIsProcessing(false);
      
      setTimeout(() => {
        fetchQuestion(true, duplicateRetries);
      }, 1000);
    }
  };

  const generateSimilarWords = (correctWord) => {
    const wordsByLength = {
     3: ['cat', 'dog', 'sun', 'hat', 'pen', 'cup', 'bat', 'fox', 'bug', 'pig', 'jar', 'car', 'bus', 'ant', 'boy', 'and', 'bed', 'act', 'pet', 'for', 'get', 'ate', 'are', 'own', 'the', 'put', 'his', 'big', 'ice', 'run', 'her', 'our', 'rug', 'hit', 'fry', 'got', 'has', 'sit', 'man', 'toe', 'tip', 'May', 'why', 'new', 'war', 'end', 'eye', 'top', 'cry', 'one', 'two', 'fan', 'old'],
     4: ['tree', 'book', 'star', 'moon', 'fish', 'bird', 'door', 'desk', 'lamp', 'cake', 'frog', 'duck', 'bear', 'wolf', 'kite', 'spot', 'exit', 'ship', 'fire', 'word', 'bell', 'rain', 'hope', 'twin', 'path', 'play', 'jump', 'zero', 'four', 'leaf', 'skin', 'cute', 'huge', 'race', 'best', 'love', 'hard', 'bath', 'city', 'farm', 'snow', 'cool', 'game', 'milk', 'care', 'girl', 'five', 'ball', 'home', 'king', 'rose', 'nine', 'life', 'back', 'land'],
     5: ['house', 'table', 'chair', 'water', 'bread', 'music', 'tiger', 'horse', 'beach', 'plane', 'plant', 'pizza', 'mouse', 'zebra', 'truck', 'about', 'block', 'China', 'actor', 'begin', 'apple', 'found', 'guess', 'event', 'doing', 'guest', 'crowd', 'brown', 'build', 'every', 'child', 'carry', 'frame', 'great', 'floor', 'glass', 'dream', 'night', 'funny', 'ideal', 'lucky', 'major', 'learn', 'order', 'quick', 'noise', 'north', 'other', 'reach', 'score', 'prize', 'tired', 'sweet', 'taste'],
     6: ['garden', 'rocket', 'planet', 'school', 'family', 'pencil', 'monkey', 'castle', 'dragon', 'flower', 'orange', 'purple', 'yellow', 'rabbit', 'turtle', 'around', 'couple', 'change', 'accept', 'battle', 'define', 'coffee', 'eleven', 'dollar', 'behind', 'camera', 'animal', 'guitar', 'parrot', 'letter', 'island', 'doctor', 'carrot', 'potato', 'circle', 'street', 'mirror', 'spring', 'figure', 'answer', 'action', 'bright', 'bounce', 'carpet', 'detail', 'effort', 'fallen', 'father', 'cheese', 'honest', 'ignore', 'ground', 'little', 'listen', 'kidney'],
     7: ['rainbow', 'dolphin', 'giraffe', 'chicken', 'balloon', 'bicycle', 'battery', 'village', 'holiday', 'penguin', 'teacher', 'kitchen', 'blanket', 'calling', 'account', 'airport', 'chapter', 'federal', 'confirm', 'feeling', 'explore', 'combine', 'discuss', 'average', 'desktop', 'clothes', 'instant', 'largely', 'holding', 'helpful', 'meeting', 'cutting', 'purpose', 'setting', 'perfect', 'railway', 'musical', 'nowhere', 'nothing', 'officer', 'outdoor', 'predict', 'tonight', 'special', 'respect', 'removed', 'totally', 'welcome', 'vehicle', 'weekend', 'upgrade', 'student', 'running', 'science'],
     8: ['elephant', 'mountain', 'computer', 'dinosaur', 'treasure', 'umbrella', 'kangaroo', 'sandwich', 'homework', 'backpack', 'continue', 'accident', 'birthday', 'baseball', 'likewise', 'magazine', 'question', 'describe', 'colorful', 'addition', 'floating', 'everyone', 'firewall', 'everyday', 'property', 'offshore', 'remember', 'somebody', 'together', 'yourself', 'whenever', 'thirteen', 'thinking', 'weakness', 'reporter', 'nineteen', 'notebook', 'marriage', 'overseas', 'lifetime', 'midnight', 'learning', 'overcome', 'keyboard', 'judgment', 'friendly', 'homeless', 'grateful', 'fourteen', 'increase', 'distance', 'electric', 'anything', 'breaking', 'bathroom']
    };

    const length = correctWord.length;
    const wordList = wordsByLength[length] || wordsByLength[5];
    return [correctWord, ...wordList.filter(w => w !== correctWord)];
  };

  const speakWord = (word, retryCount = 0) => {
    if (gameOver || levelComplete || transitioning) {
      console.log('🔇 Not speaking - game ended or transitioning');
      return;
    }

    if (retryCount > 2) {
      console.error('❌ Max retries reached for speech');
      return;
    }

    console.log('🔊 Attempting to speak:', word, `(attempt ${retryCount + 1})`);

    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      
      synth.cancel();
      
      setTimeout(() => {
        if (synth.speaking || synth.pending) {
          console.warn('⚠️ Speech synthesis busy, waiting...');
          setTimeout(() => speakWord(word, retryCount + 1), 500);
          return;
        }
        
        if (synth.paused) {
          console.log('🔊 Resuming paused synthesis');
          synth.resume();
        }
        
        const utterance = new SpeechSynthesisUtterance(word);
        
        const voices = synth.getVoices();
        
        const femaleVoice = voices.find(voice => 
          voice.name.includes('Female') ||
          voice.name.includes('Samantha') ||
          voice.name.includes('Victoria') ||
          voice.name.includes('Google US English')
        );
        
        if (femaleVoice) {
          utterance.voice = femaleVoice;
          console.log('🎤 Using voice:', femaleVoice.name);
        }
        
        utterance.rate = 0.8;
        utterance.pitch = 1.2;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        utterance.onstart = () => {
          console.log('✅ Speech started:', word);
        };
        
        utterance.onend = () => {
          console.log('✅ Speech ended:', word);
        };
        
        utterance.onerror = (event) => {
          console.error('❌ Speech error:', event.error);
          
          if (event.error === 'interrupted' && retryCount < 2) {
            console.log('🔄 Retrying speech due to interruption...');
            setTimeout(() => {
              speakWord(word, retryCount + 1);
            }, 300);
          } else if (event.error === 'canceled') {
            console.log('🔕 Speech was canceled (expected)');
          } else {
            console.error('❌ Unrecoverable speech error:', event.error);
          }
        };
        
        try {
          synth.speak(utterance);
          console.log('🔊 Speech queued successfully');
        } catch (error) {
          console.error('❌ Error queuing speech:', error);
          if (retryCount < 2) {
            setTimeout(() => speakWord(word, retryCount + 1), 500);
          }
        }
        
      }, 150);
      
    } else {
      console.error('❌ Speech synthesis not supported in this browser');
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isProcessing || feedback) {
      console.log('⛔ Submit blocked');
      return;
    }
    
    setIsProcessing(true);
    stopSpeaking();
    
    const userAnswer = gameMode === 'fillBlank' ? typedAnswer : selectedAnswer;
    const isCorrect = userAnswer.toLowerCase() === question.word.toLowerCase();
    
    // Update both total stats and level stats
    if (isCorrect) {
      setScore(prev => prev + 10);
      setCorrectAnswers(prev => prev + 1);
      setLevelScore(prev => prev + 10);
      setLevelCorrectAnswers(prev => prev + 1);
      setFeedback('✅ Perfect spelling!');
    } else {
      setFeedback(`❌ Wrong! The word was: ${question.word}`);
    }
    
    setQuestionsAnswered(prev => prev + 1);
    setLevelQuestionsAnswered(prev => prev + 1);
    
    const newLevelQuestionsAnswered = levelQuestionsAnswered + 1;
    
    console.log('📊 Level Progress:', {
      levelQuestion: newLevelQuestionsAnswered,
      totalQuestions: questionsAnswered + 1,
      levelScore: isCorrect ? levelScore + 10 : levelScore,
      totalScore: isCorrect ? score + 10 : score
    });
    
    // Check if level is complete (10 questions per level)
    if (newLevelQuestionsAnswered >= 10) {
      setTimeout(() => {
        console.log('🎉 Level Complete!');
        setLevelComplete(true);
        setIsProcessing(false);
        
        // Save progress AND update dashboard level
        saveProgressAndUpdateLevel(currentLevel);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        fetchQuestion(false);
      }, 1500);
    }
  };

  // Only submit full results when user finishes game
  const finishGame = async () => {
    console.log('🏁 Finishing game...');
    console.log('📊 Final Stats:', {
      totalScore: score,
      totalQuestions: questionsAnswered,
      totalCorrect: correctAnswers,
      levelsPlayed: currentLevel
    });
    
    stopSpeaking();
    setGameOver(true);
    
    try {
      console.log('📤 Submitting CUMULATIVE results to server...');
      const { data } = await api.post('/game/result', {
        gameType: 'word',
        score: score,
        questionsAnswered: questionsAnswered,
        correctAnswers: correctAnswers,
        level: currentLevel
      });
      
      console.log('✅ Results submitted:', data);
      
      if (data && data.totalStars !== undefined) {
        updateUserStars(data.totalStars);
        console.log('⭐ Stars updated:', data.totalStars);
      }
      
      setTimeout(() => {
        console.log('🏠 Navigating to dashboard...');
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('❌ Error submitting result:', error);
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
    }
  };

  const startGame = (level = 1) => {
    console.log('☢️ NUCLEAR START - Level:', level);
    
    stopSpeaking();
    setTransitioning(true);
    
    clearAllBlockingStates();
    
    setCurrentLevel(level);
    setGameStarted(false);
    
    // Reset only level-specific stats
    setLevelQuestionsAnswered(0);
    setLevelCorrectAnswers(0);
    setLevelScore(0);
    
    setGameOver(false);
    setLevelComplete(false);
    setQuestion(null);
    setOptions([]);
    setQuestionKey(prev => prev + 1);
    
    setTimeout(() => {
      setUsedWords([]);
      
      console.log('✅ Phase 1 - Enabling game');
      setGameStarted(true);
      setTransitioning(false);
      
      setTimeout(() => {
        console.log('✅ Phase 2 - Fetching question');
        fetchQuestion(true);
      }, 100);
    }, 300);
  };

  const handleTimeUp = () => {
    if (isProcessing || feedback) return;
    
    stopSpeaking();
    setIsProcessing(true);
    setFeedback('⏰ Time\'s up!');
    
    setQuestionsAnswered(prev => prev + 1);
    setLevelQuestionsAnswered(prev => prev + 1);
    
    const newLevelQuestionsAnswered = levelQuestionsAnswered + 1;
    
    if (newLevelQuestionsAnswered >= 10) {
      setTimeout(() => {
        setLevelComplete(true);
        setIsProcessing(false);
        
        saveProgressAndUpdateLevel(currentLevel);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsProcessing(false);
        setFeedback('');
        fetchQuestion(false);
      }, 1500);
    }
  };

  const handleOptionClick = (option) => {
    console.log('🖱️ Option clicked:', option);
    
    if (isProcessing || feedback || !question) {
      console.log('⛔ Click blocked');
      return;
    }
    
    console.log('✅ Option selected:', option);
    setSelectedAnswer(option);
  };

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const synth = window.speechSynthesis;
      
      const loadVoices = () => {
        const voices = synth.getVoices();
        console.log('🎤 Loaded voices:', voices.length);
      };
      
      loadVoices();
      
      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = loadVoices;
      }
      
      const keepAliveInterval = setInterval(() => {
        if (gameStarted && !gameOver && !levelComplete && !transitioning) {
          if (synth.paused) {
            console.log('🔊 Keep-alive: Resuming paused synthesis');
            synth.resume();
          }
          
          if (synth.pending && !synth.speaking) {
            console.log('🔧 Keep-alive: Clearing stuck queue');
            synth.cancel();
          }
        }
      }, 3000);
      
      return () => {
        clearInterval(keepAliveInterval);
        synth.cancel();
      };
    }
    
    return () => {
      console.log('🔌 WordQuest unmounting');
      stopSpeaking();
      clearAllBlockingStates();
    };
  }, [gameStarted, gameOver, levelComplete, transitioning]);

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
          <p className="text-gray-600">Getting everything ready for you!</p>
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
          <div className="text-7xl mb-6 animate-pulse">📚</div>
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
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-lg"
        >
          <div className="text-7xl mb-6">✏️</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">WordQuest</h1>
          <p className="text-gray-600 text-lg mb-8">
            Listen, unscramble, and spell words correctly! Two game modes: scrambled letters and fill-in-the-blank. 10 words per level!
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
                onClick={() => {
                  setScore(0);
                  setQuestionsAnswered(0);
                  setCorrectAnswers(0);
                  startGame(savedProgress.currentLevel);
                }}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-700 transition shadow-lg"
              >
                ▶️ Continue (Level {savedProgress.currentLevel})
              </button>
            )}

            <button
              onClick={() => {
                setScore(0);
                setQuestionsAnswered(0);
                setCorrectAnswers(0);
                startGame(1);
              }}
              className={`w-full ${
                savedProgress && savedProgress.currentLevel > 1
                  ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
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

  if (levelComplete && !gameOver) {
    const levelAccuracy = levelQuestionsAnswered > 0 ? Math.round((levelCorrectAnswers / levelQuestionsAnswered) * 100) : 0;
    
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
            <p className="text-green-600 text-xs mt-1">Dashboard level updated to {currentLevel + 1}</p>
          </div>

          <div className="space-y-4 mb-8">
            <div className="bg-orange-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Level Score</p>
              <p className="text-3xl font-bold text-orange-600">{levelScore} ⭐</p>
              <p className="text-xs text-gray-500 mt-1">{levelCorrectAnswers}/{levelQuestionsAnswered} correct</p>
            </div>
            
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Session Total</p>
              <p className="text-3xl font-bold text-purple-600">{score} ⭐</p>
              <p className="text-xs text-gray-500 mt-1">{correctAnswers}/{questionsAnswered} correct</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Level Accuracy</p>
              <p className="text-3xl font-bold text-green-600">{levelAccuracy}%</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                clearAllBlockingStates();
                setLevelComplete(false);
                setLevelQuestionsAnswered(0);
                setLevelCorrectAnswers(0);
                setLevelScore(0);
                setTimeout(() => startGame(currentLevel), 250);
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition"
            >
              🔄 Replay Level {currentLevel}
            </button>
            <button
              onClick={() => {
                clearAllBlockingStates();
                setLevelComplete(false);
                setLevelQuestionsAnswered(0);
                setLevelCorrectAnswers(0);
                setLevelScore(0);
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
            <div className="bg-purple-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Total Score</p>
              <p className="text-3xl font-bold text-purple-600">{score} ⭐</p>
            </div>
            
            <div className="bg-green-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Overall Accuracy</p>
              <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
            </div>
            
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-gray-600 text-sm">Words Completed</p>
              <p className="text-3xl font-bold text-blue-600">
                {correctAnswers} / {questionsAnswered}
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setGameOver(false);
                setScore(0);
                setQuestionsAnswered(0);
                setCorrectAnswers(0);
                startGame(1);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-600 hover:to-orange-700 transition"
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

  return (
    <div key={questionKey} className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <span className="text-4xl">✏️</span>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">WordQuest - Level {currentLevel}</h2>
              <p className="text-gray-600">Word {levelQuestionsAnswered + 1} of 10</p>
              <p className="text-sm text-orange-600 font-semibold">
                {gameMode === 'scramble' ? '🔀 Unscramble' : '📝 Fill in the Blank'}
              </p>
              <p className="text-xs text-gray-500 mt-1">Session: {questionsAnswered} total words</p>
            </div>
          </div>
          <div className="bg-yellow-100 px-6 py-3 rounded-full">
            <p className="text-sm text-gray-600">Score</p>
            <p className="text-2xl font-bold text-yellow-600">{score} ⭐</p>
          </div>
        </div>

        <div className="mb-8">
          <Timer 
            key={`${currentLevel}-${levelQuestionsAnswered}`} 
            duration={30} 
            onTimeUp={handleTimeUp} 
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin text-6xl mb-4">⏳</div>
            <p className="text-gray-600">Loading word...</p>
          </div>
        ) : (
          <>
            <div className="bg-gradient-to-r from-orange-500 to-pink-600 rounded-xl p-12 mb-6 text-center">
              <button
                onClick={() => speakWord(question?.word)}
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-8 rounded-full mb-6 transition disabled:opacity-50"
                disabled={!!feedback || isProcessing}
              >
                <span className="text-6xl">🔊</span>
              </button>
              
              {gameMode === 'scramble' ? (
                <>
                  <p className="text-white text-3xl font-bold mb-2 tracking-widest">
                    {question?.scrambled}
                  </p>
                  <p className="text-white/80 text-lg">Unscramble the letters!</p>
                </>
              ) : (
                <>
                  <p className="text-white text-4xl font-bold mb-2 tracking-wider font-mono">
                    {question?.fillBlank.display}
                  </p>
                  <p className="text-white/80 text-lg">Fill in the missing letters!</p>
                  <p className="text-white/60 text-sm mt-2">
                    {question?.fillBlank.blanks} letter(s) missing
                  </p>
                </>
              )}
              
              <p className="text-white/60 text-sm mt-4">Click the speaker to hear again</p>
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
                {gameMode === 'scramble' ? (
                  <>
                    <p className="text-center text-gray-700 font-semibold mb-4">
                      Choose the correct spelling:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {options.map((option, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleOptionClick(option)}
                          disabled={isProcessing}
                          className={`px-6 py-4 text-xl font-semibold rounded-xl border-2 transition ${
                            selectedAnswer === option
                              ? 'bg-orange-500 text-white border-orange-600'
                              : 'bg-white text-gray-800 border-gray-300 hover:border-orange-400'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={!selectedAnswer || isProcessing}
                      className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-center text-gray-700 font-semibold mb-4">
                      Type the complete word:
                    </p>
                    
                    <input
                      type="text"
                      value={typedAnswer}
                      onChange={(e) => {
                        if (!isProcessing && !feedback) {
                          setTypedAnswer(e.target.value);
                        }
                      }}
                      className="w-full px-6 py-4 text-2xl text-center border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent uppercase tracking-wider"
                      placeholder="Type the word..."
                      autoFocus
                      disabled={isProcessing || !!feedback}
                    />

                    <button
                      type="submit"
                      disabled={!typedAnswer || isProcessing}
                      className="w-full bg-gradient-to-r from-green-500 to-green-700 text-white py-4 rounded-xl text-xl font-semibold hover:from-green-600 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Answer
                    </button>
                  </>
                )}
              </form>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default WordQuest;