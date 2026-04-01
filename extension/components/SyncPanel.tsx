import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../shared/firebase';
import { syncToCloud, sync, resetAllData } from '../storage';
import BaseAuthPanel from '../../shared/components/BaseAuthPanel';

interface Props {
  onSynced: () => void;
}

export default function SyncPanel({ onSynced }: Props) {
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
