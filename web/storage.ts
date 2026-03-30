import { type StorageData } from '../shared/types';
import {
  type StorageInterface,
  syncToCloud as sharedSyncToCloud,
  sync as sharedSync,
} from '../shared/storage';

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
    if (k in all) (result as any)[k] = (all as any)[k];
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

// --- Firebase 云同步（委托给 shared/storage） ---
export async function syncToCloud(uid: string): Promise<void> {
  await sharedSyncToCloud(storage, uid);
}

export async function sync(uid: string): Promise<'synced' | 'no_change' | 'empty'> {
  return sharedSync(storage, uid);
}
