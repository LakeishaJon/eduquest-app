const Progress = require('../models/Progress');
const User = require('../models/User');

// ==========================================
// MATH GAME FUNCTIONS
// ==========================================

const generateMathQuestion = (level, userHistory = []) => {
  const operations = ['+', '-', '*'];
  
  let operation;
  if (userHistory.length > 0) {
    const weakestOp = findWeakestOperation(userHistory);
    operation = Math.random() < 0.7 ? weakestOp : operations[Math.floor(Math.random() * operations.length)];
  } else {
    operation = operations[Math.floor(Math.random() * operations.length)];
  }
  
  let num1, num2, answer;
  const difficultyMultiplier = 1 + (level * 0.3);
  const baseMax = 10;
  const maxNum = Math.floor(baseMax * difficultyMultiplier);
  
  switch(operation) {
    case '+':
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 + num2;
      break;
    case '-':
      num1 = Math.floor(Math.random() * maxNum) + level;
      num2 = Math.floor(Math.random() * num1) + 1;
      answer = num1 - num2;
      break;
    case '*':
      const multMax = Math.min(level + 3, 12);
      num1 = Math.floor(Math.random() * multMax) + 1;
      num2 = Math.floor(Math.random() * multMax) + 1;
      answer = num1 * num2;
      break;
  }
  
  return {
    question: `${num1} ${operation} ${num2}`,
    answer: answer,
    level: level,
    operation: operation,
    difficulty: Math.floor(difficultyMultiplier * 10)
  };
};

const findWeakestOperation = (history) => {
  const stats = { '+': { correct: 0, total: 0 }, '-': { correct: 0, total: 0 }, '*': { correct: 0, total: 0 } };
  
  history.forEach(item => {
    if (item.operation && stats[item.operation]) {
      stats[item.operation].total++;
      if (item.correct) stats[item.operation].correct++;
    }
  });
  
  let weakest = '+';
  let lowestAccuracy = 1;
  
  Object.keys(stats).forEach(op => {
    if (stats[op].total > 0) {
      const accuracy = stats[op].correct / stats[op].total;
      if (accuracy < lowestAccuracy) {
        lowestAccuracy = accuracy;
        weakest = op;
      }
    }
  });
  
  return weakest;
};

const getMathQuestion = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'math'
    });
    
    const level = progress ? progress.level : 1;
    const history = progress ? progress.questionHistory || [] : [];
    
    const question = generateMathQuestion(level, history);
    
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// WORD GAME FUNCTIONS
// ==========================================

const wordLists = {
  1: {
    easy: ['cat', 'dog', 'sun', 'hat', 'pen', 'cup', 'bat', 'fox', 'bug', 'pig', 'and','bed', 'act', 'pet', 'for', 'get', 'ate', 'are', 'own', 'the', 'put', 'his', 'big',],
    medium: ['car', 'bus', 'ant', 'rat', 'net', 'jar', 'log', 'web', 'egg', 'jam','ice', 'run', 'bus', 'car', 'her', 'our',' rug', 'hit', 'fry', 'got', 'has', 'sit', 'old' ],
    hard: ['zip', 'jet', 'gym', 'owl', 'elf', 'yak', 'wax', 'zoo', 'ski', 'ivy','man', 'toe', 'tip', 'May', 'why', 'new', 'war', 'end', 'eye', 'top', 'cry', 'one', 'two', 'fan' ]
  },
  2: {
    easy: ['tree', 'book', 'star', 'moon', 'fish', 'bird', 'door', 'ball', 'snow', 'leaf', 'spot', 'exit', 'ship', 'fire', 'word', 'bell', 'rain', 'hope', 'twin', 'path', 'play', 'jump', 'zero', 'four', 'leaf', 'skin', 'cute', 'huge', 'race', 'best','lucky', 'major'],
    medium: ['desk', 'lamp', 'sock', 'duck', 'ring', 'vest', 'drum', 'gift', 'kite', 'nest', 'love', 'hard', 'bath', 'city', 'farm', 'snow', 'cool', 'game', 'milk', 'care', 'girl', 'five', 'ball', 'home', 'king', 'rose', 'nine', 'life', 'back', 'land', 'learn', 'order'],
    hard: ['lynx', 'quiz', 'wasp', 'twig', 'plum', 'crab', 'frog', 'swan', 'wolf', 'maze','about', 'block', 'China', 'actor', 'begin', 'apple', 'found', 'guess', 'event', 'doing', 'guest', 'crowd', 'brown', 'build', 'every', 'doing', 'child', 'carry', 'frame', 'great', 'floor', 'glass', 'dream', 'night', 'funny', 'ideal']
  },
  3: {
    easy: ['house', 'table', 'chair', 'water', 'bread', 'music', 'tiger', 'horse', 'beach', 'plane', 'around', 'couple', 'change', 'accept', 'battle', 'define', 'coffee', 'anyway', 'common', 'corner', 'August', 'carpet' ,'detail', 'effort', 'quick', 'noise', 'north'],
    medium: ['grape', 'apple', 'lemon', 'melon', 'piano', 'watch', 'cloud', 'ocean', 'earth', 'river', 'eleven', ' dollar',' behind', 'camera',  'animal', 'guitar', 'parrot', 'letter', 'island', 'damage', 'caught' , 'fallen', 'father', 'cheese', 'honest', 'other', 'reach'],
    hard: ['zebra', 'camel', 'eagle', 'koala', 'panda', 'shark', 'whale', 'knight', 'crown', 'castle', 'doctor', 'carrot', 'potato', 'circle', 'street', 'mirror', 'spring', 'figure', 'answer', 'action', 'bright', 'bounce', 'ignore', 'ground', 'little', 'listen', 'kidney' ]
  },
  4: {
    easy: ['garden', 'rocket', 'planet', 'school', 'family', 'pencil', 'monkey', 'castle', 'dragon', 'flower', 'carpet' ,'detail', 'effort', 'fallen', 'father', 'cheese', 'honest', 'ignore', 'ground', 'little', 'listen', 'kidney', 'score', 'prize', 'tired', 'sweet', 'taste' ],
    medium: ['window', 'button', 'carpet', 'basket', 'helmet', 'market', 'magnet', 'puppet', 'tunnel', 'violin','airport', 'chapter', 'federal', 'confirm', 'feeling', 'explore', 'combined', 'discuss', 'average', 'desktop', 'clothes', 'instant', 'largely', 'holding', 'kitchen', 'helpful', 'meeting'],
    hard: ['giraffe', 'octopus', 'penguin', 'leopard', 'buffalo', 'pyramid', 'volcano', 'dolphin', 'elephant', 'triangle','accident', 'birthday', 'baseball', 'likewise', 'magazine', 'question', 'describe', 'colorful', 'addition', 'floating', 'everyone', 'firewall', 'everyday', 'property',' offshore', 'remember', 'somebody', 'together', 'yourself',' whenever']
  },
  5: {
    easy: ['elephant', 'rainbow', 'mountain', 'butterfly', 'computer', 'dinosaur', 'chocolate', 'adventure', 'treasure'],
    medium: ['kangaroo', 'alligator', 'crocodile', 'pineapple', 'blueberry', 'strawberry', 'hamburger', 'spaghetti', 'broccoli', 'cutting', 'purpose', 'setting', 'perfect', 'railway',' musical', 'nowhere', 'nothing', 'officer', 'outdoor', 'predict', 'tonight', 'special', 'respect', 'removed', 'totally', 'welcome', 'vehicle', 'weekend', 'upgrade', 'student', 'running', 'science'],
    hard: ['rhinoceros', 'hippopotamus', 'photography', 'meteorology', 'archaeology', 'multiplication', 'encyclopedia', 'extraordinary', 'thirteen', 'thinkin',' weakness', 'reporter', 'nineteen', 'notebook', 'marriage', 'overseas', 'lifetime', 'midnight', 'learning', 'overcome', 'keyboard', 'judgment', 'friendly', 'homeless', 'grateful', 'fourteen', 'increase', 'distance', 'electric', 'anything', 'breaking', 'bathroom']
  }
};

const generateWordQuestion = (level, accuracy, missedWords = []) => {
  const currentLevel = Math.min(level, 5);
  const words = wordLists[currentLevel];
  
  let difficulty;
  if (accuracy >= 90) {
    difficulty = 'hard';
  } else if (accuracy >= 70) {
    difficulty = 'medium';
  } else if (accuracy >= 50) {
    difficulty = 'medium';
  } else {
    difficulty = 'easy';
  }
  
  let word;
  if (missedWords.length > 0 && Math.random() < 0.4) {
    word = missedWords[Math.floor(Math.random() * missedWords.length)];
  } else {
    const wordPool = words[difficulty] || words.easy;
    word = wordPool[Math.floor(Math.random() * wordPool.length)];
  }
  
  return {
    word: word,
    scrambled: word.split('').sort(() => Math.random() - 0.5).join(''),
    hint: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} - ${word.length} letters`,
    level: currentLevel,
    difficulty: difficulty
  };
};

const getWordQuestion = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'word'
    });
    
    const level = progress ? progress.level : 1;
    const accuracy = progress ? progress.accuracy : 0;
    const missedWords = progress ? (progress.missedWords || []) : [];
    
    const question = generateWordQuestion(level, accuracy, missedWords);
    
    res.json(question);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getWordProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'word'
    });
    
    res.json(progress || { 
      level: 1, 
      accuracy: 0, 
      totalScore: 0, 
      totalQuestions: 0,
      correctAnswers: 0,
      missedWords: []
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const saveWordProgress = async (req, res) => {
  try {
    const { missedWords, level } = req.body;
    
    let progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'word'
    });
    
    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        gameType: 'word',
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0,
        missedWords: []
      });
    }
    
    if (missedWords) {
      progress.missedWords = missedWords;
    }
    
    if (level) {
      progress.level = level;
    }
    
    await progress.save();
    
    res.json(progress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// MEMORY GAME FUNCTIONS
// ==========================================

const memoryCardThemes = {
  opposites: {
    1: ['hot', 'cold', 'big', 'small', 'up', 'down', 'in', 'out', 'on', 'off', 'yes', 'no'],
    2: ['fast', 'slow', 'happy', 'sad', 'day', 'night', 'wet', 'dry', 'loud', 'quiet', 'good', 'bad'],
    3: ['open', 'close', 'hard', 'soft', 'long', 'short', 'near', 'far', 'full', 'empty', 'new', 'old'],
    4: ['young', 'old', 'left', 'right', 'high', 'low', 'light', 'dark', 'early', 'late', 'front', 'back'],
    5: ['thick', 'thin', 'many', 'few', 'inside', 'outside', 'over', 'under', 'push', 'pull', 'true', 'false']
  },
  habitats: {
    1: ['🐟', '🌊', '🐠', '🐡', '🦈', '🐬', '🐙', '🦀', '🦞', '🐚', '🦑', '🪼'],
    2: ['🦁', '🐘', '🦒', '🌴', '🦬', '🦓', '🐆', '🦏', '🦛', '🐊', '🦘', '🐍'],
    3: ['🐻', '🦊', '🐺', '🌲', '🦌', '🦉', '🐿️', '🐇', '🦔', '🦫', '🦝', '🐗'],
    4: ['🐫', '☀️', '🦂', '🏜️', '🦎', '🦨', '🐪', '🌵', '🦗', '🐜', '🕷️', '🦎'],
    5: ['🐧', '❄️', '🦭', '🌨️', '🐋', '🦦', '🦣', '🌬️', '🐻‍❄️', '🧊', '🦈', '🐟']
  },
  sightWords: {
    1: ['the', 'and', 'can', 'see', 'for', 'you', 'are', 'was', 'his', 'her', 'not', 'but'],
    2: ['play', 'said', 'look', 'come', 'here', 'make', 'away', 'blue', 'from', 'good', 'have', 'they'],
    3: ['help', 'find', 'funny', 'little', 'down', 'where', 'three', 'under', 'jump', 'run', 'ride', 'went'],
    4: ['always', 'before', 'around', 'pretty', 'their', 'about', 'better', 'many', 'every', 'first', 'green', 'small'],
    5: ['because', 'thought', 'enough', 'through', 'together', 'another', 'almost', 'between', 'children', 'favorite', 'different', 'important']
  },
  mathFacts: {
    1: ['1+1', '1+2', '2+2', '3+1', '4-1', '5-2', '2+1', '3-1', '1+3', '2-1', '3+2', '4-2'],
    2: ['2+3', '3+2', '4+1', '6-3', '7-2', '8-4', '5+3', '6-1', '5+2', '7-3', '6+2', '8-3'],
    3: ['5+4', '6+2', '7+1', '9-3', '10-5', '8-2', '4+4', '3+4', '2+5', '7-3', '9-4', '10-6'],
    4: ['7+3', '8+2', '9+4', '12-4', '11-5', '10-2', '6+5', '15-7', '9+1', '14-6', '13-4', '16-8'],
    5: ['8+3', '7+4', '9+2', '13-6', '14-8', '16-7', '12+3', '11+4', '18-9', '10+5', '9+6', '15-9']
  }
};

const generateMemoryCards = (level, difficulty = 'medium') => {
  const themes = ['opposites', 'habitats', 'sightWords', 'mathFacts'];
  const theme = themes[Math.floor(Math.random() * themes.length)];
  
  let numPairs;
  switch(difficulty) {
    case 'easy':
      numPairs = 6;  // 12 cards
      break;
    case 'medium':
      numPairs = 8;  // 16 cards
      break;
    case 'hard':
      numPairs = 10; // 20 cards
      break;
    default:
      numPairs = 8;
  }
  
  const currentLevel = Math.min(level, 5);
  const availableCards = memoryCardThemes[theme][currentLevel];
  
  // SAFETY CHECK: Make sure we have enough cards
  const actualNumPairs = Math.min(numPairs, availableCards.length);
  
  console.log(`🎴 Generating cards:`, {
    theme,
    level: currentLevel,
    difficulty,
    requestedPairs: numPairs,
    availableCards: availableCards.length,
    actualPairs: actualNumPairs
  });
  
  // Shuffle and pick random cards
  const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
  const selectedCards = shuffled.slice(0, actualNumPairs);
  
  // Create pairs
  const pairs = selectedCards.flatMap(card => [card, card]);
  
  // Shuffle the pairs
  const shuffledPairs = pairs.sort(() => Math.random() - 0.5);
  
  return {
    cards: shuffledPairs.map((content, index) => ({
      id: index,
      content: content,
      matched: false
    })),
    theme: theme,
    numPairs: actualNumPairs,
    level: level,
    difficulty: difficulty
  };
};

const getMemoryCards = async (req, res) => {
  try {
    console.log('🎮 Memory Cards Request:', req.query);
    
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'memory'
    });
    
    const level = progress ? progress.level : 1;
    
    // Use difficulty from query params if provided
    let difficulty = req.query.difficulty || 'medium';
    
    // Validate difficulty
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      difficulty = 'medium';
    }
    
    console.log('✅ Using difficulty:', difficulty);
    
    const cards = generateMemoryCards(level, difficulty);
    
    console.log('📦 Generated cards:', {
      theme: cards.theme,
      numPairs: cards.numPairs,
      totalCards: cards.cards.length,
      difficulty: cards.difficulty
    });
    
    res.json(cards);
  } catch (error) {
    console.error('❌ Error in getMemoryCards:', error);
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// SHARED GAME FUNCTIONS
// ==========================================

const submitResult = async (req, res) => {
  try {
    const { gameType, score, questionsAnswered, correctAnswers, questionDetails } = req.body;
    
    if (!gameType || score === undefined || !questionsAnswered || correctAnswers === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let progress = await Progress.findOne({
      userId: req.user._id,
      gameType: gameType
    });
    
    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        gameType: gameType,
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0,
        questionHistory: [],
        missedWords: []
      });
    }
    
    progress.totalQuestions += parseInt(questionsAnswered);
    progress.correctAnswers += parseInt(correctAnswers);
    progress.totalScore += parseInt(score);
    progress.lastPlayed = Date.now();
    
    if (questionDetails && Array.isArray(questionDetails)) {
      if (!progress.questionHistory) progress.questionHistory = [];
      
      questionDetails.forEach(detail => {
        if (gameType === 'math' && detail.operation) {
          progress.questionHistory.push({
            operation: detail.operation,
            correct: detail.correct,
            timestamp: Date.now()
          });
        } else if (gameType === 'word' && !detail.correct && detail.word) {
          if (!progress.missedWords) progress.missedWords = [];
          if (!progress.missedWords.includes(detail.word)) {
            progress.missedWords.push(detail.word);
          }
        }
      });
      
      if (progress.questionHistory.length > 50) {
        progress.questionHistory = progress.questionHistory.slice(-50);
      }
      
      if (progress.missedWords && progress.missedWords.length > 20) {
        progress.missedWords = progress.missedWords.slice(-20);
      }
    }
    
    const sessionAccuracy = questionsAnswered > 0 
      ? Math.round((correctAnswers / questionsAnswered) * 100) 
      : 0;
    
    progress.sessions.push({
      score: parseInt(score),
      accuracy: sessionAccuracy,
      questionsAnswered: parseInt(questionsAnswered)
    });
    
    if (progress.totalQuestions > 0) {
      progress.accuracy = Math.round((progress.correctAnswers / progress.totalQuestions) * 100);
    }
    
    const shouldLevelUp = 
      progress.accuracy >= 85 &&
      progress.totalQuestions >= progress.level * 15 &&
      progress.sessions.length >= 3;
    
    if (shouldLevelUp) {
      progress.level += 1;
    }
    
    await progress.save();
    
    const user = await User.findById(req.user._id);
    user.totalStars += parseInt(score);
    await user.save();
    
    res.json({
      progress: {
        level: progress.level,
        totalQuestions: progress.totalQuestions,
        correctAnswers: progress.correctAnswers,
        totalScore: progress.totalScore,
        accuracy: progress.accuracy
      },
      totalStars: user.totalStars,
      levelUp: shouldLevelUp,
      aiInsights: {
        difficulty: progress.accuracy >= 85 ? 'Increasing difficulty!' : 
                   progress.accuracy >= 70 ? 'Great progress!' :
                   'Keep practicing!',
        nextChallenge: shouldLevelUp ? `Level ${progress.level} unlocked!` : `${Math.max(0, 85 - progress.accuracy)}% more to level up`
      }
    });
  } catch (error) {
    console.error('Submit result error:', error);
    res.status(400).json({ message: error.message });
  }
};

const getProgress = async (req, res) => {
  try {
    const mathProgress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'math'
    });
    
    const wordProgress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'word'
    });
    
    const memoryProgress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'memory'
    });
    
    res.json({
      math: mathProgress || { 
        level: 1, 
        accuracy: 0, 
        totalScore: 0, 
        totalQuestions: 0,
        correctAnswers: 0
      },
      word: wordProgress || { 
        level: 1, 
        accuracy: 0, 
        totalScore: 0, 
        totalQuestions: 0,
        correctAnswers: 0
      },
      memory: memoryProgress || { 
        level: 1, 
        accuracy: 0, 
        totalScore: 0, 
        totalQuestions: 0,
        correctAnswers: 0
      }
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getLeaderboard = async (req, res) => {
  try {
    const users = await User.find()
      .select('username totalStars')
      .sort({ totalStars: -1 })
      .limit(10);
    
    res.json(users);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const updateGameLevel = async (req, res) => {
  try {
    const { gameType, level } = req.body;
    const userId = req.user._id;

    console.log('📊 Updating level for dashboard:', { userId, gameType, level });

    if (!gameType || !level) {
      return res.status(400).json({ 
        message: 'Game type and level are required' 
      });
    }

    if (!['math', 'word', 'memory'].includes(gameType)) {
      return res.status(400).json({ 
        message: 'Invalid game type' 
      });
    }

    let progress = await Progress.findOne({ 
      userId: userId,
      gameType: gameType
    });
    
    if (!progress) {
      progress = new Progress({ 
        userId: userId,
        gameType: gameType,
        level: level,
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0,
        accuracy: 0
      });
    } else {
      progress.level = level;
    }

    await progress.save();

    console.log('✅ Level updated successfully:', {
      gameType,
      newLevel: level
    });

    res.json({
      message: 'Level updated successfully',
      gameType: gameType,
      currentLevel: level
    });

  } catch (error) {
    console.error('❌ Error updating level:', error);
    res.status(500).json({ 
      message: 'Error updating level', 
      error: error.message 
    });
  }
};

//  Get memory progress (for continue feature)
const getMemoryProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'memory'
    });
    
    res.json(progress || { 
      level: 1, 
      accuracy: 0, 
      totalScore: 0, 
      totalQuestions: 0,
      correctAnswers: 0,
      currentLevel: 1,
      lastPlayed: null
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Save memory progress (for continue feature)
const saveMemoryProgress = async (req, res) => {
  try {
    const { currentLevel, lastPlayed } = req.body;
    
    let progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'memory'
    });
    
    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        gameType: 'memory',
        level: currentLevel || 1,
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0
      });
    }
    
    if (currentLevel) {
      progress.level = currentLevel;
    }
    
    if (lastPlayed) {
      progress.lastPlayed = lastPlayed;
    }
    
    await progress.save();
    
    res.json(progress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Get math progress (for continue feature)
const getMathProgress = async (req, res) => {
  try {
    const progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'math'
    });
    
    res.json(progress || { 
      level: 1, 
      accuracy: 0, 
      totalScore: 0, 
      totalQuestions: 0,
      correctAnswers: 0,
      currentLevel: 1,
      lastPlayed: null
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

//  Save math progress (for continue feature)
const saveMathProgress = async (req, res) => {
  try {
    const { currentLevel, lastPlayed } = req.body;
    
    let progress = await Progress.findOne({
      userId: req.user._id,
      gameType: 'math'
    });
    
    if (!progress) {
      progress = new Progress({
        userId: req.user._id,
        gameType: 'math',
        level: currentLevel || 1,
        totalQuestions: 0,
        correctAnswers: 0,
        totalScore: 0
      });
    }
    
    if (currentLevel) {
      progress.level = currentLevel;
    }
    
    if (lastPlayed) {
      progress.lastPlayed = lastPlayed;
    }
    
    await progress.save();
    
    res.json(progress);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  getMathQuestion,
  getMathProgress,        
  saveMathProgress,       
  getWordQuestion,
  getWordProgress,
  saveWordProgress,
  getMemoryCards,
  getMemoryProgress,      
  saveMemoryProgress,     
  submitResult,
  getProgress,
  getLeaderboard,
  updateGameLevel         
};