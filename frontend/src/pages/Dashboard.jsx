import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  //  Fetch progress on mount
  useEffect(() => {
    console.log('📊 Dashboard mounted - fetching progress');
    fetchProgress();
  }, []);

  // Auto-refresh every 5 seconds for real-time updates
  useEffect(() => {
    console.log('⏱️ Setting up auto-refresh interval');
    
    const intervalId = setInterval(() => {
      console.log('🔄 Auto-refreshing dashboard...');
      fetchProgress(true);
    }, 5000); // Refresh every 5 seconds

    return () => {
      console.log('🧹 Cleaning up auto-refresh interval');
      clearInterval(intervalId);
    };
  }, []);

  // 🔧  Refetch when window gains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      console.log('👀 Window focused - refreshing dashboard');
      fetchProgress(true);
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchProgress = async (isSilent = false) => {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      
      console.log('📥 Fetching progress from API...');
      const { data } = await api.get('/game/progress');
      console.log('✅ Progress fetched:', data);
      
      setProgress(data);
    } catch (error) {
      console.error('❌ Error fetching progress:', error);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Loading your progress...</p>
        </div>
      </div>
    );
  }

  // Chart data
  const chartData = progress ? [
    {
      name: 'Math',
      score: progress.math.totalScore,
      accuracy: progress.math.accuracy,
      level: progress.math.level
    },
    {
      name: 'Words',
      score: progress.word.totalScore,
      accuracy: progress.word.accuracy,
      level: progress.word.level
    },
    {
      name: 'Memory',
      score: progress.memory?.totalScore || 0,
      accuracy: progress.memory?.accuracy || 0,
      level: progress.memory?.level || 1
    }
  ] : [];

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold text-white drop-shadow-lg mb-4">
            Your Dashboard 📊
          </h1>
          <p className="text-white/90 text-xl">
            Welcome back, {user?.username}!
          </p>
          <p className="text-white/70 text-sm mt-2">
            📡 Auto-updating every 5 seconds
          </p>
        </motion.div>

        {/* Four summary cards  */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl p-6 shadow-xl"
          >
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-white/90 text-sm mb-1">Total Stars</p>
            <p className="text-white text-4xl font-bold">{user?.totalStars || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 shadow-xl"
          >
            <div className="text-5xl mb-3">🧮</div>
            <p className="text-white/90 text-sm mb-1">Math Level</p>
            <p className="text-white text-4xl font-bold">Level {progress?.math.level || 1}</p>
            <p className="text-white/80 text-sm mt-2">
              {progress?.math.accuracy || 0}% accuracy
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-xl"
          >
            <div className="text-5xl mb-3">✏️</div>
            <p className="text-white/90 text-sm mb-1">Word Level</p>
            <p className="text-white text-4xl font-bold">Level {progress?.word.level || 1}</p>
            <p className="text-white/80 text-sm mt-2">
              {progress?.word.accuracy || 0}% accuracy
            </p>
          </motion.div>

          {/* Memory Card! */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-xl"
          >
            <div className="text-5xl mb-3">🧠</div>
            <p className="text-white/90 text-sm mb-1">Memory Level</p>
            <p className="text-white text-4xl font-bold">Level {progress?.memory?.level || 1}</p>
            <p className="text-white/80 text-sm mt-2">
              {progress?.memory?.accuracy || 0}% accuracy
            </p>
          </motion.div>
        </div>

        {/* Progress Chart - shows all 3 games! */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl shadow-2xl p-8 mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Your Progress Comparison
          </h2>
          
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#14b8a6" 
                strokeWidth={3}
                name="Total Score"
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#f97316" 
                strokeWidth={3}
                name="Accuracy %"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Three detailed stats cards  */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* MathQuest Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-3xl mr-3">🧮</span>
              MathQuest Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Level</span>
                <span className="text-2xl font-bold text-teal-600">
                  {progress?.math.level || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Score</span>
                <span className="text-2xl font-bold text-amber-600">
                  {progress?.math.totalScore || 0} ⭐
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="text-2xl font-bold text-green-600">
                  {progress?.math.accuracy || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Questions Answered</span>
                <span className="text-2xl font-bold text-cyan-600">
                  {progress?.math.totalQuestions || 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* WordQuest Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-3xl mr-3">✏️</span>
              WordQuest Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Level</span>
                <span className="text-2xl font-bold text-orange-600">
                  {progress?.word.level || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Score</span>
                <span className="text-2xl font-bold text-amber-600">
                  {progress?.word.totalScore || 0} ⭐
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="text-2xl font-bold text-green-600">
                  {progress?.word.accuracy || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Words Mastered</span>
                <span className="text-2xl font-bold text-cyan-600">
                  {progress?.word.totalQuestions || 0}
                </span>
              </div>
            </div>
          </motion.div>

          {/* MemoryQuest Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-white rounded-2xl shadow-xl p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <span className="text-3xl mr-3">🧠</span>
              MemoryQuest Stats
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Level</span>
                <span className="text-2xl font-bold text-purple-600">
                  {progress?.memory?.level || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Score</span>
                <span className="text-2xl font-bold text-amber-600">
                  {progress?.memory?.totalScore || 0} ⭐
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Accuracy</span>
                <span className="text-2xl font-bold text-green-600">
                  {progress?.memory?.accuracy || 0}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Games Played</span>
                <span className="text-2xl font-bold text-cyan-600">
                  {progress?.memory?.totalQuestions || 0}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;