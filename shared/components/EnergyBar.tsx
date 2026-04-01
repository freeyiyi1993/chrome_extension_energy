import { type AppState } from '../types';

interface Props {
  state: AppState;
  className?: string;
}

export default function EnergyBar({ state, className }: Props) {
  const energyPercent = (state.energy / state.maxEnergy) * 100;
  let barColor = '#10b981';
  if (state.energy < 20) barColor = '#ef4444';
  else if (state.energy < 40) barColor = '#f59e0b';

  return (
    <div className={className}>
      <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden relative flex items-center justify-center">
        <div className="absolute left-0 top-0 h-full transition-all duration-300 z-0" style={{ width: `${energyPercent}%`, backgroundColor: barColor }} />
        <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">
          精力值:{Math.floor(state.energy)} / {state.maxEnergy}
        </span>
      </div>
    </div>
  );
}
