import { useState, useEffect } from 'react';
import { ChevronLeft } from 'lucide-react';
import { type StorageData, type Config } from '../../../types';

interface Props {
  data: StorageData;
  onBack: () => void;
  onSaved: () => void;
}

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

function InputRow({ label, field, min, max, step, config, onChange }: { label: string, field: keyof Config, min?: number, max?: number, step?: string, config: Config, onChange: (k: keyof Config, v: number) => void }) {
  return (
    <div className="flex justify-between items-center mb-2">
      <div className="text-xs text-gray-600 flex-1">{label}</div>
      <input
        type="number"
        className="w-16 p-1 border border-gray-300 rounded text-xs outline-none text-right focus:border-emerald-500"
        value={config[field]}
        min={min} max={max} step={step}
        onChange={(e) => onChange(field, parseFloat(e.target.value))}
      />
    </div>
  );
}

export default function SettingsPage({ data, onBack, onSaved }: Props) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (data.config) {
      setTimeout(() => setConfig(data.config!), 0);
    }
  }, [data]);

  const handleChange = (k: keyof Config, v: number) => {
    setConfig((prev: Config) => ({ ...prev, [k]: v }));
  };

  const handleSave = async () => {
    const oldConfig = data.config || DEFAULT_CONFIG;
    await chrome.storage.local.set({ config });

    const d = (await chrome.storage.local.get(['logs', 'state'])) as StorageData;
    if (d.state) {
      const diff = config.maxEnergy - oldConfig.maxEnergy;
      d.state.maxEnergy += diff;
      if (d.state.maxEnergy < config.minEnergy) d.state.maxEnergy = config.minEnergy;
      if (d.state.energy > d.state.maxEnergy) d.state.energy = d.state.maxEnergy;
      await chrome.storage.local.set({ state: d.state });
    }

    const logs = d.logs || [];
    logs.unshift({ time: new Date().toLocaleString(), text: `⚙️ 系统配置已更新` });
    await chrome.storage.local.set({ logs });

    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
    onSaved();
  };

  // 删除组件内嵌的 InputRow

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      <div className="flex items-center mb-3 px-1">
        <div className="cursor-pointer text-gray-600 flex items-center gap-1 text-sm font-bold transition-colors hover:text-gray-900" onClick={onBack}>
          <ChevronLeft size={18} /> 返回
        </div>
        <div className="flex-1 text-center font-bold text-base text-gray-800 mr-10">系统设置</div>
      </div>

      {showToast && (
        <div className="bg-emerald-500 text-white text-center p-2 rounded-md mb-3 text-xs animate-[fadeIn_0.2s_ease]">
          ✅ 设置已保存！
        </div>
      )}

      <div className="bg-white rounded-lg p-3 shadow-sm flex-1 overflow-y-auto">
        <div className="font-bold mb-3 text-[13px]">📊 基础配置</div>
        <InputRow config={config} onChange={handleChange} label="默认精力上限" field="maxEnergy" min={10} />
        <InputRow config={config} onChange={handleChange} label="最低精力保底" field="minEnergy" min={0} />

        <div className="font-bold my-3 text-[13px]">✨ 日常恢复</div>
        <InputRow config={config} onChange={handleChange} label="小恢复点数 (喝水/拉伸/小憩/冥想)" field="smallHeal" min={0} />
        <InputRow config={config} onChange={handleChange} label="中恢复点数 (主食/运动满30m)" field="midHeal" min={0} />
        <InputRow config={config} onChange={handleChange} label="大恢复比例 (睡眠满8h)" field="bigHealRatio" min={0} max={1} step="0.1" />

        <div className="font-bold my-3 text-[13px]">🔥 日常消耗</div>
        <InputRow config={config} onChange={handleChange} label="基础消耗速率 (点/时)" field="decayRate" min={0} step="0.5" />
        <InputRow config={config} onChange={handleChange} label="错过饭点惩罚倍率" field="penaltyMultiplier" min={1} step="0.1" />

        <div className="font-bold my-3 text-[13px]">📈 长期成长 (上限升降)</div>
        <InputRow config={config} onChange={handleChange} label="完美一天上限提升" field="perfectDayBonus" min={0} />
        <InputRow config={config} onChange={handleChange} label="糟糕一天上限下降" field="badDayPenalty" min={0} />

        <button
          className="w-full bg-emerald-500 text-white border-none p-2 rounded-md text-[13px] font-bold cursor-pointer mt-2 hover:bg-emerald-600 transition-colors"
          onClick={handleSave}
        >
          保存并应用
        </button>
      </div>
    </div>
  );
}
