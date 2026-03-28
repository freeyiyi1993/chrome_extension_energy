import { type Config, type AppState, type Tasks, type StorageData } from '../types';

const DEFAULT_CONFIG: Config = {
  maxEnergy: 65,
  minEnergy: 5,
  smallHeal: 2,
  midHeal: 5,
  bigHealRatio: 0.2,
  decayRate: 4,
  penaltyMultiplier: 1.5,
  perfectDayBonus: 1,
  badDayPenalty: 1
};

function getLogicalDate() {
  const now = new Date();
  const h = now.getHours();
  if (h < 8) {
    now.setDate(now.getDate() - 1);
  }
  return now.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

function getLogical8AM() {
  const now = new Date();
  const h = now.getHours();
  if (h < 8) {
    now.setDate(now.getDate() - 1);
  }
  now.setHours(8, 0, 0, 0);
  return now.getTime();
}

async function initData() {
  const data = (await chrome.storage.local.get(null)) as StorageData;
  const todayStr = getLogicalDate();

  const config = data.config || DEFAULT_CONFIG;
  if (!data.config) {
    await chrome.storage.local.set({ config });
  }

  if (!data.state) {
    const now = Date.now();
    const startOfToday = getLogical8AM();
    const minsPassedSince8AM = Math.max(0, (now - startOfToday) / 60000);

    let initialEnergy = config.maxEnergy * 0.8;
    let decayRate = config.decayRate / 60;
    const currentHour = new Date().getHours();

    if (currentHour >= 9 || currentHour >= 13 || currentHour >= 19) {
      decayRate *= config.penaltyMultiplier;
    }

    initialEnergy -= decayRate * minsPassedSince8AM;
    if (initialEnergy < config.minEnergy) initialEnergy = config.minEnergy;

    await chrome.storage.local.set({
      state: {
        logicalDate: todayStr,
        maxEnergy: config.maxEnergy,
        energy: initialEnergy,
        lastUpdateTime: now,
        lowEnergyReminded: false,
        energyConsumed: 0,
        pomodoro: { running: false, timeLeft: 25 * 60, count: 0, perfectCount: 0, consecutiveCount: 0 }
      },
      tasks: { sleep: null, exercise: null, meals: 0, water: 0, stretch: 0, nap: false, meditate: 0, poop: false },
      stats: [],
      logs: []
    });
  }
  chrome.alarms.create("tick", { periodInMinutes: 1 });
}

async function handleDayRollover(data: StorageData, todayStr: string) {
  const { state, tasks, stats } = data as { state: AppState, tasks: Tasks, stats: any[] };
  const config = data.config || DEFAULT_CONFIG;
  let maxEnergyDelta = 0;

  const isHealthyTasksDone = tasks.sleep && tasks.sleep >= 8 && tasks.meals >= 3 && tasks.exercise && tasks.exercise >= 30 && tasks.water >= 3 && tasks.stretch >= 3 && tasks.poop;

  const pomoCount = state.pomodoro.count;
  const perfectCount = state.pomodoro.perfectCount;

  // 检查是否没有任何输入（节假日/空闲模式）
  const isNoInput = !tasks.sleep && !tasks.exercise && tasks.meals === 0 && tasks.water === 0 && tasks.stretch === 0 && !tasks.nap && tasks.meditate === 0 && !tasks.poop && pomoCount === 0;

  // 如果是没有任何输入的节假日模式，直接跳过所有惩罚判断，也不计入历史统计
  if (isNoInput) {
    state.logicalDate = todayStr;
    state.energy = state.maxEnergy * 0.8;
    state.energyConsumed = 0;
    state.lastUpdateTime = Date.now();
    state.lowEnergyReminded = false;
    state.pomodoro.count = 0;
    state.pomodoro.perfectCount = 0;
    state.pomodoro.consecutiveCount = 0;

    const newTasks: Tasks = { sleep: null, exercise: null, meals: 0, water: 0, stretch: 0, nap: false, meditate: 0, poop: false };

    await chrome.storage.local.set({ state, tasks: newTasks });
    return;
  }

  if (isHealthyTasksDone && perfectCount >= 4) {
    maxEnergyDelta += config.perfectDayBonus;
  }

  if (perfectCount === 0 && (!tasks.exercise || tasks.exercise < 30) && (!tasks.sleep || tasks.sleep < 6)) {
    maxEnergyDelta -= config.badDayPenalty;
  }

  const yesterdayDate = state.logicalDate;
  stats.push({
    date: yesterdayDate,
    maxEnergy: state.maxEnergy,
    energyConsumed: state.energyConsumed || 0,
    pomoCount,
    perfectCount
  });

  state.maxEnergy += maxEnergyDelta;
  if (state.maxEnergy < config.minEnergy) state.maxEnergy = config.minEnergy;

  state.logicalDate = todayStr;
  state.energy = state.maxEnergy * 0.8;
  state.energyConsumed = 0;
  state.lastUpdateTime = Date.now();
  state.lowEnergyReminded = false;
  state.pomodoro.count = 0;
  state.pomodoro.perfectCount = 0;
  state.pomodoro.consecutiveCount = 0;

  const newTasks: Tasks = { sleep: null, exercise: null, meals: 0, water: 0, stretch: 0, nap: false, meditate: 0, poop: false };

  await chrome.storage.local.set({ state, tasks: newTasks, stats });
}

chrome.runtime.onInstalled.addListener(() => {
  initData();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "tick") {
    const data = (await chrome.storage.local.get(null)) as StorageData;
    if (!data.state) return;

    const todayStr = getLogicalDate();
    if (data.state.logicalDate !== todayStr) {
      await handleDayRollover(data, todayStr);
      return;
    }

    const now = Date.now();
    const { state, tasks } = data as { state: AppState, tasks: Tasks };
    const config = data.config || DEFAULT_CONFIG;
    const minsPassed = (now - state.lastUpdateTime) / 60000;
    state.lastUpdateTime = now;

    let decayRate = config.decayRate / 60;
    const currentHour = new Date().getHours();

    const missedMeals = currentHour >= 19 && tasks.meals < 2;

    if (missedMeals) {
      decayRate *= config.penaltyMultiplier;
    }

    const drop = decayRate * minsPassed;
    state.energyConsumed = (state.energyConsumed || 0) + drop;
    state.energy -= drop;
    if (state.energy < config.minEnergy) state.energy = config.minEnergy;

    if (state.energy < 20 && !state.lowEnergyReminded) {
      state.lowEnergyReminded = true;
      chrome.tabs.create({ url: chrome.runtime.getURL("src/pages/finish/finish.html?type=energy") });
    }

    if (state.pomodoro.running) {
      state.pomodoro.timeLeft -= 60 * minsPassed;
      if (state.pomodoro.timeLeft <= 0) {
        state.pomodoro.running = false;
        state.pomodoro.timeLeft = 25 * 60;

        state.pomodoro.consecutiveCount = (state.pomodoro.consecutiveCount || 0) + 1;
        const isForcedBreak = state.pomodoro.consecutiveCount >= 3;

        chrome.tabs.create({ url: chrome.runtime.getURL(`src/pages/finish/finish.html?type=pomodoro&forcedBreak=${isForcedBreak}`) });

        if (isForcedBreak) {
          state.pomodoro.consecutiveCount = 0; // 重置连续计数
        }
      }
    }

    await chrome.storage.local.set({ state });
  }
});
