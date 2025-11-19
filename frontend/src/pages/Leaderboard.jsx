import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../utils/api';

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data } = await api.get('/game/leaderboard');
      setLeaders(data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMedalEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="text-7xl mb-4">🏆</div>
          <h1 className="text-5xl font-bold text-white mb-4">
            Leaderboard
          </h1>
          <p className="text-white/80 text-xl">
            Top performers in EduQuest
          </p>
        </motion.div>

        <div className="space-y-4">
          {leaders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl shadow-xl p-12 text-center"
            >
              <div className="text-6xl mb-4">📝</div>
              <p className="text-gray-600 text-xl">
                No players yet. Be the first to play!
              </p>
            </motion.div>
          ) : (
            leaders.map((leader, index) => (
              <motion.div
                key={leader._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white rounded-2xl shadow-xl p-6 flex items-center justify-between hover:shadow-2xl transition ${
                  index < 3 ? 'border-2 border-yellow-400' : ''
                }`}
              >
                <div className="flex items-center space-x-6">
                  <div className={`text-4xl font-bold ${
                    index === 0 ? 'text-yellow-500' :
                    index === 1 ? 'text-gray-400' :
                    index === 2 ? 'text-orange-600' :
                    'text-gray-600'
                  }`}>
                    {getMedalEmoji(index + 1)}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {leader.username}
                    </h3>
                    <p className="text-gray-500">
                      Rank #{index + 1}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 bg-yellow-100 px-6 py-3 rounded-full">
                  <span className="text-3xl">⭐</span>
                  <span className="text-2xl font-bold text-yellow-600">
                    {leader.totalStars}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {leaders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl p-8 text-center"
          >
            <h3 className="text-white text-2xl font-bold mb-2">
              Think you can make it to the top?
            </h3>
            <p className="text-white/90 text-lg mb-6">
              Play more games to earn stars and climb the leaderboard!
            </p>
            <div className="flex justify-center space-x-4">
              <a
                href="/math"
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Play MathQuest
              </a>
              <a
                href="/word"
                className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Play WordQuest
              </a>
               <a
                href="/memory"
                className="bg-white text-pink-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Play MemoryQuest
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;