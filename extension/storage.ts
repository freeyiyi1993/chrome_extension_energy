import { type StorageData } from '../shared/types';
import {
  type StorageInterface,
  syncToCloud as sharedSyncToCloud,
  sync as sharedSync,
  resetAllData as sharedResetAllData,
} from '../shared/storage';
import { createFirebaseSync } from '../shared/cloudSync';

// --- Chrome 扩展存储实现 ---
const chromeGet = async (keys: string[] | null): Promise<Partial<StorageData>> => {
  if (keys === null) return chrome.storage.local.get(null) as unknown as Promise<StorageData>;
  return chrome.storage.local.get(keys as (keyof StorageData)[]) as unknown as Promise<Partial<StorageData>>;
};

const chromeSet = async (data: Partial<StorageData>): Promise<void> => {
  await chrome.storage.local.set(data);
};

export const storage: StorageInterface = {
  get: chromeGet,
  set: chromeSet,
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
