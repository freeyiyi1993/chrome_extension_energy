import { type StorageData } from '../../shared/types';
import { getLogicalDate } from '../../shared/utils/time';
import { migratePomodoro } from '../../shared/storage';
import { handleDayRollover, processTick } from '../../shared/ticker';

/** handleTick 返回值：告诉调用方要写什么、要打开哪些页面 */
export interface TickAction {
  type: 'none' | 'dayRollover';
  toWrite: Partial<StorageData>;
  openTabs: string[];
}

/** 可测试的 tick 核心逻辑：接收数据，返回要写入的数据和要打开的页面 */
export function handleTick(data: StorageData, now: number, finishUrlBase: string): TickAction {
  if (!data.state) return { type: 'none', toWrite: {}, openTabs: [] };

  migratePomodoro(data.state);

  const todayStr = getLogicalDate();
  if (data.state.logicalDate !== todayStr) {
    const { toWrite } = handleDayRollover(data, todayStr);
    return { type: 'dayRollover', toWrite, openTabs: [] };
  }

  const result = processTick(data, now);
  const openTabs: string[] = [];

  if (result.lowEnergyTriggered) {
    openTabs.push(`${finishUrlBase}?type=energy`);
  }

  if (result.pomoExpired) {
    openTabs.push(`${finishUrlBase}?type=pomodoro&forcedBreak=${result.isForcedBreak}`);
  }

  return { type: 'none', toWrite: { state: result.state }, openTabs };
}
