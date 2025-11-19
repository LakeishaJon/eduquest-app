const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['math', 'word', 'memory'],
    required: true
  },
  level: {
    type: Number,
    default: 1
  },
  currentLevel: {
    type: Number,
    default: 1
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  correctAnswers: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  accuracy: {
    type: Number,
    default: 0
  },
  lastPlayed: {
    type: Date,
    default: Date.now
  },
  questionHistory: [{
    operation: String,
    correct: Boolean,
    timestamp: Date
  }],
  missedWords: [String],
  sessions: [{
    score: Number,
    accuracy: Number,
    questionsAnswered: Number,
    playedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

progressSchema.pre('save', function(next) {
  if (this.totalQuestions > 0) {
    this.accuracy = Math.round((this.correctAnswers / this.totalQuestions) * 100);
  }
  next();
});

module.exports = mongoose.model('Progress', progressSchema);
