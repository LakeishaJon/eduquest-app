import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const GameCard = ({ title, description, icon, color, link }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -5 }}
      whileTap={{ scale: 0.95 }}
      className="relative"
    >
      <Link to={link}>
        <div className={`${color} rounded-2xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 cursor-pointer`}>
          <div className="text-6xl mb-4">{icon}</div>
          <h3 className="text-white text-2xl font-bold mb-2">{title}</h3>
          <p className="text-white/90 text-lg">{description}</p>
          <div className="mt-6 flex items-center text-white font-semibold">
            <span>Start Playing</span>
            <span className="ml-2">→</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default GameCard;