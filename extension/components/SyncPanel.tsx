import { signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../shared/firebase';
import { syncToCloud, sync, resetAllData } from '../storage';
import BaseAuthPanel from '../../shared/components/BaseAuthPanel';

interface Props {
  onSynced: () => void;
}

export default function SyncPanel({ onSynced }: Props) {
  const handleGoogleLogin = async () => {
    const response = await chrome.runtime.sendMessage({ type: 'GOOGLE_LOGIN' });
    if (response?.error) throw new Error(response.error);
    if (!response?.accessToken) throw new Error('未获取到 access_token');

    const credential = GoogleAuthProvider.credential(null, response.accessToken);
    await signInWithCredential(auth, credential);
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
