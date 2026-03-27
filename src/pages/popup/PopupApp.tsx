import { useState, useEffect } from 'react';
import MainDashboard from './components/MainDashboard';
import RulesPage from './components/RulesPage';
import StatsPage from './components/StatsPage';
import SettingsPage from './components/SettingsPage';
import MenuPanel from './components/MenuPanel';
import { type StorageData } from '../../types';

export type PageType = 'main' | 'rules' | 'stats' | 'settings';

export default function PopupApp() {
  const [currentPage, setCurrentPage] = useState<PageType>('main');
  const [menuOpen, setMenuOpen] = useState(false);
  const [data, setData] = useState<StorageData | null>(null);

  const fetchData = async () => {
    const result = await chrome.storage.local.get(null);
    setData(result as StorageData);
  };

  useEffect(() => {
    // 延迟首次加载避免严格模式下的同步更新警告
    setTimeout(fetchData, 0);
    const interval = setInterval(() => {
      if (currentPage === 'main') {
        fetchData();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const navigateTo = (page: PageType) => {
    setCurrentPage(page);
    setMenuOpen(false);
  };

  if (!data || !data.state) {
    return <div className="p-4 text-center text-gray-500">加载中...</div>;
  }

  return (
    <div className="relative min-h-[400px] bg-gray-50 p-2.5">
      <MenuPanel
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={navigateTo}
      />

      {currentPage === 'main' && (
        <MainDashboard
          data={data}
          onOpenMenu={() => setMenuOpen(true)}
          onDataChange={fetchData}
        />
      )}

      {currentPage === 'rules' && <RulesPage data={data} onBack={() => navigateTo('main')} />}

      {currentPage === 'stats' && (
        <StatsPage data={data} onBack={() => navigateTo('main')} />
      )}

      {currentPage === 'settings' && (
        <SettingsPage data={data} onBack={() => navigateTo('main')} onSaved={fetchData} />
      )}
    </div>
  );
}
