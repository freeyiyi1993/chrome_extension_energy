import { ChevronLeft } from 'lucide-react';
import { type StorageData, type Config } from '../../../types';

const DEFAULT_CONFIG: Config = {
  maxEnergy: 65,
  minEnergy: 5,
  smallHeal: 2,
  midHeal: 5,
  bigHealRatio: 0.2,
  decayRate: 4,
  penaltyMultiplier: 1.5,
  perfectDayBonus: 1,
  badDayPenalty: 1
};

export default function RulesPage({ data, onBack }: { data: StorageData; onBack: () => void }) {
  const config = data.config || DEFAULT_CONFIG;

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      <div className="flex items-center mb-3 px-1">
        <div className="cursor-pointer text-gray-600 flex items-center gap-1 text-sm font-bold transition-colors hover:text-gray-900" onClick={onBack}>
          <ChevronLeft size={18} /> 返回
        </div>
        <div className="flex-1 text-center font-bold text-base text-gray-800 mr-10">系统规则说明</div>
      </div>

      <div className="text-[11px] text-gray-500 bg-amber-50 border border-amber-200 p-2 rounded-md mb-3">
        💡 提示：以下为系统的默认运作规则。您可以在「设置中心」调整数值。
      </div>

      <div className="flex flex-col gap-2">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="font-bold text-[13px] mb-2 flex items-center gap-1">🌱 日常恢复</div>
          <ul className="list-none p-0 m-0 text-xs">
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>每日 8:00 基础恢复</span> <span className="text-emerald-500 font-bold">上限的 80%</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>睡眠恢复 (大)</span> <span className="text-emerald-500 font-bold">+ {Math.round(config.maxEnergy * config.bigHealRatio)} (上限的 {Math.round(config.bigHealRatio * 100)}%)</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>主食/运动 (中)</span> <span className="text-emerald-500 font-bold">+ {config.midHeal} 点/次</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>喝水/拉伸/小憩/冥想/肠道 (小)</span> <span className="text-emerald-500 font-bold">+ {config.smallHeal} 点/次</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>睡眠(7-10h)或运动(&lt;30m)</span> <span className="text-emerald-500 font-bold">按比例恢复</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>睡眠不足 7h 或超过 10h</span> <span className="text-red-500 font-bold">无恢复</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="font-bold text-[13px] mb-2 flex items-center gap-1">🔥 日常消耗</div>
          <ul className="list-none p-0 m-0 text-xs">
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>基础自然流失</span> <span className="text-red-500 font-bold">- {config.decayRate} 点/小时</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>错过饭点惩罚</span> <span className="text-red-500 font-bold">流失率 x {config.penaltyMultiplier}</span>
            </li>
          </ul>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="font-bold text-[13px] mb-2 flex items-center gap-1">📈 长期成长 (次日生效)</div>
          <ul className="list-none p-0 m-0 text-xs">
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>完美一天 (任务全清+4完美番茄)</span> <span className="text-emerald-500 font-bold">精力上限 + {config.perfectDayBonus}</span>
            </li>
            <li className="flex justify-between py-1 border-b border-dashed border-gray-200 last:border-0">
              <span>糟糕一天 (0完美番茄且无运动少睡)</span> <span className="text-red-500 font-bold">精力上限 - {config.badDayPenalty}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
