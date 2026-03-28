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
  poop: boolean;
}

export interface LogEntry {
  time: string;
  text: string;
}

export type CompactLog = [
  number, // 0: timestamp
  number, // 1: action type (0=sleep,1=exercise,2=meals,3=water,4=stretch,5=nap,6=meditate,7=poop,8=pomo)
  number, // 2: value (e.g. 8 for sleep, 1 for 1st meal, 100 for pomo score, 1 for boolean true)
  number  // 3: energy diff
];

export type AppLogEntry = {
  time?: string; // 兼容旧版本数据
  text?: string; // 兼容旧版本数据
  t?: number;    // 兼容中间版本数据
  txt?: string;  // 兼容中间版本数据
} | CompactLog;

export interface StorageData {
  config?: Config;
  state?: AppState;
  tasks?: Tasks;
  stats?: any[];
  logs?: AppLogEntry[];
}
