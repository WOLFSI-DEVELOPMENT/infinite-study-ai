import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

const PomodoroTimer: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play sound or notify
      if (mode === 'focus') {
        setMode('break');
        setTimeLeft(5 * 60);
      } else {
        setMode('focus');
        setTimeLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
        {mode === 'focus' ? 'Focus Time' : 'Break Time'}
      </h3>
      <div className={`text-4xl font-bold mb-4 font-mono ${mode === 'focus' ? 'text-primary-600' : 'text-secondary-500'}`}>
        {formatTime(timeLeft)}
      </div>
      <div className="flex gap-2">
        <button
          onClick={toggleTimer}
          className={`p-2 rounded-full text-white transition-colors ${isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-primary-600 hover:bg-primary-700'}`}
        >
          {isActive ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <button
          onClick={resetTimer}
          className="p-2 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
        >
          <RotateCcw size={20} />
        </button>
      </div>
    </div>
  );
};

export default PomodoroTimer;