import { describe, it, expect, vi, beforeEach } from 'vitest';
import { type StorageData, type AppState, type PomodoroTimer } from '../shared/types';

// Mock firebase
vi.mock('../shared/firebase', () => ({
  auth: {},
  googleProvider: {},
  db: {},
}));

import { submitPomoScore } from '../shared/utils/pomoSubmit';
import { type StorageInterface } from '../shared/storage';
import { POMO_ACTION_ID } from '../shared/constants/actionMapping';

const basePomo: PomodoroTimer = { status: 'idle', updatedAt: 0, consecutiveCount: 0 };

function makeState(overrides: Partial<AppState> = {}): AppState {
  return {
    logicalDate: '2026-03-31',
    energy: 65,
    maxEnergy: 65,
    energyConsumed: 0,
    lastUpdateTime: Date.now(),
    lowEnergyReminded: false,
    pomodoro: { ...basePomo },
    pomoCount: 0,
    pomoPerfectCount: 0,
    ...overrides,
  };
}

function mockStorage(data: Partial<StorageData>): StorageInterface & { lastSet: Partial<StorageData> | null } {
  const store: StorageInterface & { lastSet: Partial<StorageData> | null } = {
    lastSet: null,
    get: async () => data,
    set: async (d) => { store.lastSet = d; },
  };
  return store;
}

describe('submitPomoScore', () => {
  it('submits score and increments pomoCount', async () => {
    const storage = mockStorage({ state: makeState(), logs: [] });
    const result = await submitPomoScore(storage, 80);
    expect(result).toBe(true);
    expect(storage.lastSet).toBeDefined();
    expect(storage.lastSet!.state!.pomoCount).toBe(1);
    expect(storage.lastSet!.state!.pomoPerfectCount).toBe(0);
    // log entry
    const logs = storage.lastSet!.logs!;
    expect(logs.length).toBe(1);
    expect(logs[0][1]).toBe(POMO_ACTION_ID);
    expect(logs[0][2]).toBe(80);
  });

  it('increments pomoPerfectCount for score 100', async () => {
    const storage = mockStorage({ state: makeState(), logs: [] });
    await submitPomoScore(storage, 100);
    expect(storage.lastSet!.state!.pomoPerfectCount).toBe(1);
    expect(storage.lastSet!.state!.pomoCount).toBe(1);
  });

  it('does not increment pomoPerfectCount for score < 100', async () => {
    const storage = mockStorage({ state: makeState(), logs: [] });
    await submitPomoScore(storage, 90);
    expect(storage.lastSet!.state!.pomoPerfectCount).toBe(0);
  });

  it('deduplicates within 2 minutes', async () => {
    const now = Date.now();
    const recentLog = [now - 60_000, POMO_ACTION_ID, 100, 0]; // 1 minute ago
    const storage = mockStorage({ state: makeState(), logs: [recentLog] as any });
    const result = await submitPomoScore(storage, 80);
    expect(result).toBe(false);
    expect(storage.lastSet).toBeNull(); // nothing written
  });

  it('allows submission after 2 minutes', async () => {
    const now = Date.now();
    const oldLog = [now - 130_000, POMO_ACTION_ID, 100, 0]; // > 2 minutes ago
    const storage = mockStorage({ state: makeState(), logs: [oldLog] as any });
    const result = await submitPomoScore(storage, 80);
    expect(result).toBe(true);
  });

  it('returns false when no state', async () => {
    const storage = mockStorage({ logs: [] });
    const result = await submitPomoScore(storage, 100);
    expect(result).toBe(false);
  });

  it('accumulates pomoCount on existing count', async () => {
    const storage = mockStorage({ state: makeState({ pomoCount: 3, pomoPerfectCount: 2 }), logs: [] });
    await submitPomoScore(storage, 100);
    expect(storage.lastSet!.state!.pomoCount).toBe(4);
    expect(storage.lastSet!.state!.pomoPerfectCount).toBe(3);
  });

  it('prepends log entry (unshift)', async () => {
    const existingLog = [Date.now() - 300_000, 0, 8, -5]; // old sleep log
    const storage = mockStorage({ state: makeState(), logs: [existingLog] as any });
    await submitPomoScore(storage, 70);
    const logs = storage.lastSet!.logs!;
    expect(logs.length).toBe(2);
    expect(logs[0][1]).toBe(POMO_ACTION_ID); // new entry first
    expect(logs[0][2]).toBe(70);
  });
});
