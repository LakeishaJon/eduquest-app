const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();


//  CORS configuration for production
const allowedOrigins = [
  'http://localhost:5173', // Development
  'http://localhost:3000', // Development alternative
  process.env.FRONTEND_URL // Production
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'EduQuest API is running!' });
});


app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/game', require('./routes/gameRoutes'));
app.use('/api/test', require('./routes/testRoutes')); // TEST ROUTE

app.get('/', (req, res) => {
  res.json({ 
    message: '��� Welcome to EduQuest API!',
    version: '1.0.0',
    endpoints: {
      users: '/api/users',
      game: '/api/game',
      test: '/api/test/users'
    }
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

const PORT = process.env.PORT || 5000;

// ✅ Database connection with retry
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    // Retry after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

connectDB();

app.listen(PORT, () => {
  console.log(`��� Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
});
