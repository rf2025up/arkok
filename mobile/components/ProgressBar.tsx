import React from 'react';
import { Zap } from 'lucide-react';

interface ProgressBarProps {
  currentExp: number;
  level: number;
  expForLevel: (lvl: number) => number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentExp, level, expForLevel }) => {
  // Calculate accumulated exp for levels before current
  const getAccumulatedExp = (lvl: number) => {
    let acc = 0;
    for (let i = 1; i < lvl; i++) {
      acc += expForLevel(i);
    }
    return acc;
  };

  // Calculate progress percentage for current level
  const accumulatedExp = getAccumulatedExp(level);
  const expNeededForCurrentLevel = expForLevel(level);
  const expInCurrentLevel = Math.max(0, currentExp - accumulatedExp);
  const progressPercentage = Math.min(100, Math.floor((expInCurrentLevel / expNeededForCurrentLevel) * 100));

  // Next level
  const nextLevel = level + 1;
  const expForNextLevel = expForLevel(nextLevel);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 border-2 border-blue-100">
      {/* Level Info */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-600">当前等级</span>
            <span className="text-3xl font-black text-primary">{level}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">下一级需要 {expForNextLevel} 经验值</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end mb-1">
            <Zap size={16} className="text-yellow-500" />
            <span className="text-sm font-bold text-gray-700">{currentExp}</span>
          </div>
          <p className="text-xs text-gray-500">{expInCurrentLevel} / {expNeededForCurrentLevel}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-sm">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="h-full bg-gradient-to-r from-white/20 to-transparent"></div>
        </div>
      </div>

      {/* Progress Text */}
      <p className="text-xs text-gray-600 mt-2 text-center font-semibold">{progressPercentage}% 进度</p>

      {/* Level up indicator */}
      {progressPercentage === 100 && (
        <div className="mt-2 p-2 bg-yellow-100 text-yellow-800 rounded-lg text-center text-xs font-bold animate-pulse">
          🎉 恭喜！即将升级！
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
