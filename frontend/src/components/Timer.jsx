import { useEffect, useState } from 'react';

const Timer = ({ duration, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const percentage = (timeLeft / duration) * 100;
  const color = percentage > 50 ? 'bg-green-500' : percentage > 20 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-white font-semibold">Time Left</span>
        <span className="text-white text-xl font-bold">{timeLeft}s</span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
        <div
          className={`${color} h-4 transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default Timer;