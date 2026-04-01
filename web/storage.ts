import { type StorageData } from '../shared/types';
import {
  type StorageInterface,
  syncToCloud as sharedSyncToCloud,
  sync as sharedSync,
  resetAllData as sharedResetAllData,
} from '../shared/storage';
import { createFirebaseSync } from '../shared/cloudSync';

// Web 版使用 localStorage
const LOCAL_KEY = 'energy_app_data';

function getLocalData(): StorageData {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setLocalData(data: StorageData): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
}

const webGet = async (keys: string[] | null): Promise<Partial<StorageData>> => {
  const all = getLocalData();
  if (keys === null) return all;
  const result: Partial<StorageData> = {};
  for (const k of keys) {
    const key = k as keyof StorageData;
    if (key in all) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic key access on StorageData
      (result as any)[key] = all[key];
    }
  }
  return result;
};

const webSet = async (data: Partial<StorageData>): Promise<void> => {
  const all = getLocalData();
  Object.assign(all, data);
  setLocalData(all);
};

export const storage: StorageInterface = {
  get: webGet,
  set: webSet,
};

// --- Firebase 云同步（委托给 shared/storage + cloudSync） ---
export async function syncToCloud(uid: string): Promise<void> {
  await sharedSyncToCloud(storage, createFirebaseSync(uid));
}

export async function sync(uid: string): Promise<'synced' | 'no_change' | 'empty'> {
  return sharedSync(storage, createFirebaseSync(uid));
}

export async function resetAllData(uid?: string): Promise<void> {
  return sharedResetAllData(storage, uid ? createFirebaseSync(uid) : undefined);
}
