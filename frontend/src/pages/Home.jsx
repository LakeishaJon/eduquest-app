import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGameClick = (path) => {
    if (!user) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            Welcome to EduQuest! 🚀
          </h1>
          <p className="text-white text-2xl mb-2 drop-shadow">
            Learn, Play & Grow with Fun Games
          </p>
          {!user && (
            <p className="text-amber-300 text-lg mt-4 font-medium">
              Please login or sign up to start your learning adventure!
            </p>
          )}
          {user && (
            <p className="text-amber-300 text-xl mt-4 font-medium">
              Welcome back, {user.username}! Choose your quest below.
            </p>
          )}
        </motion.div>

        {/* THREE GAME CARDS */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* MathQuest Card */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div onClick={() => handleGameClick('/math')}>
              <GameCard
                title="MathQuest"
                description="Master arithmetic with fun challenges!"
                icon="🧮"
                color="bg-gradient-to-br from-teal-400 to-cyan-600"
                link="/math"
              />
            </div>
          </motion.div>

          {/* WordQuest Card */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div onClick={() => handleGameClick('/word')}>
              <GameCard
                title="WordQuest"
                description="Improve spelling and vocabulary skills!"
                icon="✏️"
                color="bg-gradient-to-br from-orange-400 to-orange-600"
                link="/word"
              />
            </div>
          </motion.div>

          {/* MemoryQuest Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div onClick={() => handleGameClick('/memory')}>
              <GameCard
                title="MemoryQuest"
                description="Test your memory with card matching!"
                icon="🧠"
                color="bg-gradient-to-br from-purple-400 to-purple-600"
                link="/memory"
              />
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            Why EduQuest? ✨
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4">
              <div className="text-5xl mb-3">🏆</div>
              <h3 className="text-teal-600 text-xl font-semibold mb-2">
                Earn Rewards
              </h3>
              <p className="text-gray-600">
                Collect stars and unlock badges as you progress
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-5xl mb-3">📊</div>
              <h3 className="text-orange-500 text-xl font-semibold mb-2">
                Track Progress
              </h3>
              <p className="text-gray-600">
                See your improvement with detailed charts
              </p>
            </div>
            <div className="text-center p-4">
              <div className="text-5xl mb-3">🎯</div>
              <h3 className="text-amber-500 text-xl font-semibold mb-2">
                Level Up
              </h3>
              <p className="text-gray-600">
                Challenge yourself with increasing difficulty
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;