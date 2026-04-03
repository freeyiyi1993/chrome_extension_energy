import { useEffect } from 'react';
import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../shared/firebase';
import { syncToCloud, sync, resetAllData } from '../storage';
import BaseAuthPanel from '../../shared/components/BaseAuthPanel';

interface Props {
  onSynced: () => void;
}

/** 尝试用 Chrome 缓存的 OAuth token 静默登录 */
async function trySignInWithCachedToken(): Promise<boolean> {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false });
    const token = typeof result === 'string' ? result : result.token;
    if (!token) return false;

    const credential = GoogleAuthProvider.credential(null, token);
    try {
      await signInWithCredential(auth, credential);
      return true;
    } catch {
      await chrome.identity.removeCachedAuthToken({ token });
      return false;
    }
  } catch {
    return false;
  }
}

export default function SyncPanel({ onSynced }: Props) {
  // popup 打开时：若上次授权窗口导致 popup 关闭，Chrome 已缓存 token，静默登录
  useEffect(() => {
    if (!auth.currentUser) {
      trySignInWithCachedToken();
    }
  }, []);

  const requestToken = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GOOGLE_LOGIN' });
    if (response?.error) throw new Error(response.error);
    if (!response?.accessToken) throw new Error('未获取到 access_token');
    return response.accessToken as string;
  };

  const handleGoogleLogin = async () => {
    const token = await requestToken();
    const credential = GoogleAuthProvider.credential(null, token);
    try {
      await signInWithCredential(auth, credential);
    } catch {
      // token 可能已过期但 Chrome 缓存未感知，清除后重试一次
      await chrome.identity.removeCachedAuthToken({ token });
      const freshToken = await requestToken();
      const freshCredential = GoogleAuthProvider.credential(null, freshToken);
      await signInWithCredential(auth, freshCredential);
    }
  };

  const handleLogout = async () => {
    await chrome.storage.local.clear();
  };

  return (
    <BaseAuthPanel
      onSynced={onSynced}
      onGoogleLogin={handleGoogleLogin}
      onLogout={handleLogout}
      syncFn={sync}
      syncToCloudFn={syncToCloud}
      resetAllDataFn={resetAllData}
      messageTimeout={5000}
    />
  );
}
