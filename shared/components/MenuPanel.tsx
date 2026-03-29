import { X, Home, BookOpen, BarChart2, Settings } from 'lucide-react';
import { type PageType } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageType) => void;
}

export default function MenuPanel({ isOpen, onClose, onNavigate }: Props) {
  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[100] transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed top-0 left-0 w-[70%] h-full bg-white z-[101] shadow-[2px_0_8px_rgba(0,0,0,0.1)] transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 font-bold text-base border-b border-gray-200 text-gray-800 flex justify-between items-center">
          <span>功能菜单</span>
          <div className="cursor-pointer text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded transition-colors" onClick={onClose}>
            <X size={18} />
          </div>
        </div>

        <div className="flex-1 py-2">
          <MenuItem icon={<Home size={18} />} label="主页面" onClick={() => onNavigate('main')} />
          <MenuItem icon={<BookOpen size={18} />} label="规则说明" onClick={() => onNavigate('rules')} />
          <MenuItem icon={<BarChart2 size={18} />} label="数据统计" onClick={() => onNavigate('stats')} />
          <MenuItem icon={<Settings size={18} />} label="设置中心" onClick={() => onNavigate('settings')} />
        </div>
      </div>
    </>
  );
}

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
  return (
    <div
      className="px-4 py-3 cursor-pointer border-b border-gray-50 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors flex items-center gap-3 text-sm font-medium"
      onClick={onClick}
    >
      {icon}
      {label}
    </div>
  );
}
