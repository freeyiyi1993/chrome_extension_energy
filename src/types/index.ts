export interface Config {
  maxEnergy: number;
  minEnergy: number;
  smallHeal: number;
  midHeal: number;
  bigHealRatio: number;
  decayRate: number;
  penaltyMultiplier: number;
  perfectDayBonus: number;
  badDayPenalty: number;
}

export interface PomodoroState {
  running: boolean;
  timeLeft: number;
  count: number;
  perfectCount: number;
  consecutiveCount: number; // 新增：连续番茄钟计数
}

export interface AppState {
  logicalDate: string;
  maxEnergy: number;
  energy: number;
  lastUpdateTime: number;
  lowEnergyReminded: boolean;
  energyConsumed?: number;
  pomodoro: PomodoroState;
}

export interface Tasks {
  sleep: number | null;
  exercise: number | null;
  meals: number;
  water: number;
  stretch: number;
  nap: boolean;
  meditate: number;
}

export interface LogEntry {
  time: string;
  text: string;
}

export interface StorageData {
  config?: Config;
  state?: AppState;
  tasks?: Tasks;
  stats?: any[];
  logs?: LogEntry[];
}
