import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../shared/firebase';
import { type StorageData } from '../shared/types';

// Web 版始终使用 localStorage
export const isChromeExtension = false;

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

// 统一存储接口
export const storage = {
  get: webGet,
  set: webSet,
};

// Firestore 不支持嵌套数组，CompactLog 是 [n,n,n,n] 会导致 logs 成为嵌套数组
// 上传前转为对象数组，下载后还原
function logsToFirestore(logs: any[]): any[] {
  return logs.map(entry =>
    Array.isArray(entry) ? { _t: entry[0], _a: entry[1], _v: entry[2], _d: entry[3] } : entry
  );
}

function logsFromFirestore(logs: any[]): any[] {
  return logs.map(entry =>
    entry && typeof entry === 'object' && '_t' in entry ? [entry._t, entry._a, entry._v, entry._d] : entry
  );
}

// --- Firebase 云同步 ---
export async function syncToCloud(uid: string): Promise<void> {
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

export async function pullAndMerge(uid: string): Promise<void> {
  const cloudData = await syncFromCloud(uid);
  if (!cloudData) {
    // 云端无数据，清空本地
    localStorage.removeItem(LOCAL_KEY);
    return;
  }
  // 拉取以云端为准，直接覆盖本地
  setLocalData(cloudData);
}
