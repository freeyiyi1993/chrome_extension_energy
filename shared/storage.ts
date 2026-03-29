import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { type StorageData } from './types';

// 统一存储接口：各平台（Chrome 扩展 / Web）各自实现
export interface StorageInterface {
  get(keys: string[] | null): Promise<Partial<StorageData>>;
  set(data: Partial<StorageData>): Promise<void>;
}

// --- Firebase 云同步（接受 StorageInterface 参数） ---
export async function syncToCloud(storage: StorageInterface, uid: string): Promise<void> {
  const data = await storage.get(null) as StorageData;
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    ...data,
    lastSyncAt: Date.now(),
  }, { merge: true });
}

export async function syncFromCloud(uid: string): Promise<StorageData | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const cloudData = snap.data() as StorageData & { lastSyncAt?: number };
  delete (cloudData as any).lastSyncAt;
  return cloudData;
}

export async function pullAndMerge(storage: StorageInterface, uid: string): Promise<void> {
  const cloudData = await syncFromCloud(uid);
  if (!cloudData) return;

  const localData = await storage.get(null) as StorageData;

  // 简单策略：云端数据的 lastUpdateTime 更新则用云端，否则保留本地
  const cloudTime = cloudData.state?.lastUpdateTime || 0;
  const localTime = localData.state?.lastUpdateTime || 0;

  if (cloudTime > localTime) {
    await storage.set(cloudData);
  }
}
