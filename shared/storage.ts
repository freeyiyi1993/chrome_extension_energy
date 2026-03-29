import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { type StorageData } from './types';

// 统一存储接口：各平台（Chrome 扩展 / Web）各自实现
export interface StorageInterface {
  get(keys: string[] | null): Promise<Partial<StorageData>>;
  set(data: Partial<StorageData>): Promise<void>;
}

// --- Firestore 日志转换 ---
// Firestore 不支持嵌套数组，CompactLog [n,n,n,n] 需转为对象

export function logsToFirestore(logs: any[]): any[] {
  return logs.map(entry =>
    Array.isArray(entry) ? { _t: entry[0], _a: entry[1], _v: entry[2], _d: entry[3] } : entry
  );
}

export function logsFromFirestore(logs: any[]): any[] {
  return logs.map(entry =>
    entry && typeof entry === 'object' && '_t' in entry ? [entry._t, entry._a, entry._v, entry._d] : entry
  );
}

// --- Firebase 云同步 ---

export async function syncToCloud(storage: StorageInterface, uid: string): Promise<void> {
  const data = await storage.get(null) as StorageData;
  const ref = doc(db, 'users', uid);
  const payload = {
    ...data,
    logs: data.logs ? logsToFirestore(data.logs) : [],
    lastSyncAt: Date.now(),
  };
  await setDoc(ref, payload, { merge: true });
}

export async function syncFromCloud(uid: string): Promise<StorageData | null> {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const cloudData = snap.data() as StorageData & { lastSyncAt?: number };
  delete (cloudData as any).lastSyncAt;
  if (cloudData.logs) {
    cloudData.logs = logsFromFirestore(cloudData.logs);
  }
  return cloudData;
}

/** 智能拉取：比较时间戳，取更新的 */
export async function pullAndMerge(storage: StorageInterface, uid: string): Promise<'cloud' | 'local' | 'empty'> {
  const cloudData = await syncFromCloud(uid);
  if (!cloudData) return 'empty';

  const localData = await storage.get(null) as StorageData;
  const cloudTime = cloudData.state?.lastUpdateTime || 0;
  const localTime = localData.state?.lastUpdateTime || 0;

  if (cloudTime > localTime) {
    await storage.set(cloudData);
    return 'cloud';
  }
  return 'local';
}

/** 强制拉取：云端直接覆盖本地。clearFn 负责平台特定的清除逻辑 */
export async function forcePull(storage: StorageInterface, uid: string, clearFn: () => Promise<void>): Promise<void> {
  const cloudData = await syncFromCloud(uid);
  await clearFn();
  if (cloudData) {
    await storage.set(cloudData);
  }
}
