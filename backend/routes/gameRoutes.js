const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/gameController');
const { protect } = require('../middleware/auth');

// Math game routes
router.get('/math/question', protect, getMathQuestion);
router.get('/math/progress', protect, getMathProgress);      
router.post('/math/progress', protect, saveMathProgress);    

// Word game routes
router.get('/word/question', protect, getWordQuestion);
router.get('/word/progress', protect, getWordProgress);
router.post('/word/progress', protect, saveWordProgress);

// Memory game routes
router.get('/memory/cards', protect, getMemoryCards);
router.get('/memory/progress', protect, getMemoryProgress);  // 
router.post('/memory/progress', protect, saveMemoryProgress); // 

// Shared routes
router.post('/result', protect, submitResult);
router.get('/progress', protect, getProgress);
router.get('/leaderboard', getLeaderboard);

//  Real-time level update route
router.post('/level-update', protect, updateGameLevel);       

module.exports = router;