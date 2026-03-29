import { type CustomTaskDef, type Tasks } from '../types';

export function parseTimeStr(timeStr: string | null): number {
  if (!timeStr) return 24;
  const [h, p] = timeStr.split(' ');
  let hour24 = parseInt(h);
  if (p === 'PM' && hour24 !== 12) hour24 += 12;
  if (p === 'AM' && hour24 === 12) hour24 = 0;
  return hour24;
}

/** 逻辑日期：8:00 AM 前算前一天 */
export function getLogicalDate(): string {
  const now = new Date();
  if (now.getHours() < 8) now.setDate(now.getDate() - 1);
  return now.toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });
}

/** 当前逻辑日的 8:00 AM 时间戳 */
export function getLogical8AM(): number {
  const now = new Date();
  if (now.getHours() < 8) now.setDate(now.getDate() - 1);
  now.setHours(8, 0, 0, 0);
  return now.getTime();
}

/** 根据 taskDefs 构建空任务记录 */
export function buildEmptyTasks(taskDefs: CustomTaskDef[]): Tasks {
  const tasks: Tasks = {};
  for (const def of taskDefs) {
    if (!def.enabled) continue;
    if (def.type === 'counter') tasks[def.id] = 0;
    else if (def.type === 'boolean') tasks[def.id] = false;
    else tasks[def.id] = null;
  }
  return tasks;
}
