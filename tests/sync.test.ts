import { describe, it, expect } from 'vitest';
import { type AppState } from '../shared/types';

// 复制 mergeState 核心逻辑进行测试（原函数未导出，且依赖 Firebase）
function mergeState(local: AppState, cloud: AppState): AppState {
  if (local.logicalDate !== cloud.logicalDate) {
    const newer = local.logicalDate > cloud.logicalDate ? local : cloud;
    return { ...newer, lastUpdateTime: Date.now() };
  }

  const lp = local.pomodoro;
  const cp = cloud.pomodoro;
  const running = lp.running || cp.running;
  const startedAt = (lp.startedAt && cp.startedAt) ? Math.min(lp.startedAt, cp.startedAt)
    : lp.startedAt || cp.startedAt;
  const timeLeft = running && startedAt
    ? Math.max(0, 25 * 60 - (Date.now() - startedAt) / 1000)
    : (lp.running && cp.running) ? Math.min(lp.timeLeft, cp.timeLeft)
    : lp.running ? lp.timeLeft
    : cp.running ? cp.timeLeft
    : lp.timeLeft;

  return {
    energy: Math.min(local.energy, cloud.energy),
    maxEnergy: Math.min(local.maxEnergy, cloud.maxEnergy),
    energyConsumed: Math.max(local.energyConsumed || 0, cloud.energyConsumed || 0),
    logicalDate: local.logicalDate,
    lowEnergyReminded: local.lowEnergyReminded || cloud.lowEnergyReminded,
    lastUpdateTime: Date.now(),
    pomodoro: {
      running,
      timeLeft,
      startedAt: running ? startedAt : undefined,
      count: Math.max(lp.count, cp.count),
      perfectCount: Math.max(lp.perfectCount, cp.perfectCount),
      consecutiveCount: Math.max(lp.consecutiveCount, cp.consecutiveCount),
    },
  };
}

const basePomo = { running: false, timeLeft: 25 * 60, count: 0, perfectCount: 0, consecutiveCount: 0 };

describe('mergeState - cross-day', () => {
  it('should take the day-rolled-over side when dates differ', () => {
    const yesterday: AppState = {
      logicalDate: '2026-03-30',
      energy: 25,
      maxEnergy: 100,
      energyConsumed: 75,
      lastUpdateTime: Date.now() - 60000,
      lowEnergyReminded: true,
      pomodoro: { ...basePomo, count: 5, perfectCount: 3 },
    };

    const today: AppState = {
      logicalDate: '2026-03-31',
      energy: 100,
      maxEnergy: 100,
      energyConsumed: 0,
      lastUpdateTime: Date.now(),
      lowEnergyReminded: false,
      pomodoro: basePomo,
    };

    // 本地未日切，云端已日切
    const result1 = mergeState(yesterday, today);
    expect(result1.logicalDate).toBe('2026-03-31');
    expect(result1.energy).toBe(100);
    expect(result1.energyConsumed).toBe(0);
    expect(result1.pomodoro.count).toBe(0);

    // 反过来：本地已日切，云端未日切
    const result2 = mergeState(today, yesterday);
    expect(result2.logicalDate).toBe('2026-03-31');
    expect(result2.energy).toBe(100);
  });

  it('should merge normally when both sides are on the same day', () => {
    const local: AppState = {
      logicalDate: '2026-03-31',
      energy: 80,
      maxEnergy: 100,
      energyConsumed: 20,
      lastUpdateTime: Date.now(),
      lowEnergyReminded: false,
      pomodoro: { ...basePomo, count: 2, perfectCount: 1 },
    };

    const cloud: AppState = {
      logicalDate: '2026-03-31',
      energy: 70,
      maxEnergy: 100,
      energyConsumed: 30,
      lastUpdateTime: Date.now() - 30000,
      lowEnergyReminded: false,
      pomodoro: { ...basePomo, count: 3, perfectCount: 2 },
    };

    const result = mergeState(local, cloud);
    expect(result.logicalDate).toBe('2026-03-31');
    expect(result.energy).toBe(70);
    expect(result.energyConsumed).toBe(30);
    expect(result.pomodoro.count).toBe(3);
    expect(result.pomodoro.perfectCount).toBe(2);
  });
});
