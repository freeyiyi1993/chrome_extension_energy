import { Menu, Play, RefreshCw, Droplet, Coffee, Activity, Moon, Brain } from 'lucide-react';
import { useState, useEffect } from 'react';
import { type StorageData, type Tasks } from '../../../types';


interface Props {
  data: StorageData;
  onOpenMenu: () => void;
  onDataChange: () => void;
}

export default function MainDashboard({ data, onOpenMenu, onDataChange }: Props) {
  const { state, tasks, config } = data;

  const [localSleep, setLocalSleep] = useState<string>('');
  const [localExercise, setLocalExercise] = useState<string>('');

  useEffect(() => {
    if (tasks?.sleep !== null && tasks?.sleep !== undefined) setLocalSleep(String(tasks.sleep));
    if (tasks?.exercise !== null && tasks?.exercise !== undefined) setLocalExercise(String(tasks.exercise));
  }, [tasks]);

  if (!state || !tasks || !config) return null;

  const energyPercent = Math.min(100, Math.max(0, (state.energy / state.maxEnergy) * 100));
  let barColor = '#10b981'; // emerald-500
  if (state.energy < 20) barColor = '#ef4444'; // red-500
  else if (state.energy < 40) barColor = '#f59e0b'; // amber-500

  const pomoPercent = 100 - (state.pomodoro.timeLeft / (25 * 60)) * 100;
  const m = Math.floor(state.pomodoro.timeLeft / 60).toString().padStart(2, '0');
  const s = (Math.floor(state.pomodoro.timeLeft) % 60).toString().padStart(2, '0');

  const togglePomo = async () => {
    const newState = { ...state, pomodoro: { ...state.pomodoro, running: !state.pomodoro.running } };
    await chrome.storage.local.set({ state: newState });
    onDataChange();
  };

  const resetPomo = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newState = { ...state, pomodoro: { ...state.pomodoro, running: false, timeLeft: 25 * 60 } };
    await chrome.storage.local.set({ state: newState });
    onDataChange();
  };

  const handleTaskSave = async (key: keyof Tasks, val: number | string | boolean) => {
    // 允许累加的任务类型
    const isCounterTask = ['meals', 'water', 'stretch', 'meditate'].includes(key);

    if (!isCounterTask && tasks[key] !== null && tasks[key] !== false) return;
    if (isCounterTask && (tasks[key] as number) >= 3) return;

    const d = await chrome.storage.local.get(['tasks', 'state', 'logs', 'config']) as StorageData;
    if (!d.tasks || !d.state) return;

    const currentConfig = d.config || config;
    const oldEnergy = d.state.energy;

    if (isCounterTask) {
      (d.tasks as any)[key] = ((d.tasks as any)[key] || 0) + 1;
    } else {
      (d.tasks as any)[key] = val;
    }

    if (key === 'sleep' && typeof val === 'number') {
      const ratio = val >= 8 ? 1 : val / 8;
      d.state.energy = Math.min(d.state.maxEnergy, d.state.energy + d.state.maxEnergy * currentConfig.bigHealRatio * ratio);
    } else if (key === 'exercise' && typeof val === 'number') {
      const ratio = val >= 30 ? 1 : val / 30;
      d.state.energy = Math.min(d.state.maxEnergy, d.state.energy + currentConfig.midHeal * ratio);
    } else if (key === 'meals') {
      d.state.energy = Math.min(d.state.maxEnergy, d.state.energy + currentConfig.midHeal);
    } else if (key === 'water' || key === 'stretch' || key === 'nap' || key === 'meditate') {
      d.state.energy = Math.min(d.state.maxEnergy, d.state.energy + currentConfig.smallHeal);
    }

    const energyDiff = d.state.energy - oldEnergy;
    const taskNames: Record<string, string> = {
      sleep: '睡眠', exercise: '运动',
      meals: '主食', water: '喝水', stretch: '拉伸',
      nap: '小憩', meditate: '冥想'
    };

    let logVal: string | number = '';
    if (isCounterTask) logVal = `第 ${(d.tasks as any)[key]} 次`;
    else if (typeof val === 'boolean') logVal = '完成';
    else logVal = val;

    let logText = `✅ 打卡 [${taskNames[key as string]}] : ${logVal}`;
    if (energyDiff > 0) logText += ` (+${(energyDiff % 1 === 0 ? energyDiff : energyDiff.toFixed(1))}精力)`;
    else if (energyDiff < 0) logText += ` (${(energyDiff % 1 === 0 ? energyDiff : energyDiff.toFixed(1))}精力)`;

    const logs = d.logs || [];
    logs.unshift({ time: new Date().toLocaleString(), text: logText });
    await chrome.storage.local.set({ tasks: d.tasks, state: d.state, logs });
    onDataChange();
  };

  const renderCounterButton = (key: 'meals' | 'water' | 'stretch' | 'meditate', label: string, icon: React.ReactNode) => {
    const count = (tasks[key] as number) || 0;
    const isMax = count >= 3;
    return (
      <div className="flex flex-col h-full justify-end">
        <button
          className={`h-[26px] rounded flex items-center justify-center text-xs font-bold transition-colors ${isMax ? 'bg-emerald-500/20 text-emerald-700 cursor-not-allowed border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'}`}
          disabled={isMax}
          onClick={() => handleTaskSave(key, true)}
        >
          {isMax ? '✅ 已满 (3/3)' : <>{icon} {label} ({count}/3)</>}
        </button>
      </div>
    );
  };

  const renderBooleanButton = (key: 'nap', label: string, icon: React.ReactNode) => {
    const isDone = tasks[key] as boolean;
    return (
      <div className="flex flex-col h-full justify-end">
        <button
          className={`h-[26px] rounded flex items-center justify-center text-xs font-bold transition-colors ${isDone ? 'bg-emerald-500/20 text-emerald-700 cursor-not-allowed border border-emerald-200' : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200'}`}
          disabled={isDone}
          onClick={() => handleTaskSave(key, true)}
        >
          {isDone ? '✅ 已完成' : <>{icon} {label}</>}
        </button>
      </div>
    );
  };

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      {/* Header */}
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="w-7 h-7 flex items-center justify-center cursor-pointer text-gray-600 rounded-md hover:bg-gray-200 transition-colors" onClick={onOpenMenu}>
          <Menu size={20} />
        </div>
        <div className="font-bold text-base text-gray-800">精力管理</div>
        <div className="w-7"></div>
      </div>

      {/* Energy Bar */}
      <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
        <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden relative flex items-center justify-center">
          <div className="absolute left-0 top-0 h-full transition-all duration-300 z-0" style={{ width: `${energyPercent}%`, backgroundColor: barColor }} />
          <span className="relative z-10 text-xs font-bold text-white drop-shadow-md">
            精力值:{Math.floor(state.energy)} / {state.maxEnergy}
          </span>
        </div>
      </div>

      {/* Pomodoro */}
      <div className="bg-white rounded-lg p-3 mb-3 shadow-sm">
        <div className="relative w-[140px] mx-auto">
          <div
            className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full cursor-pointer z-20 opacity-60 hover:opacity-100 hover:bg-gray-200 hover:rotate-15 transition-all shadow-sm text-sm"
            onClick={resetPomo}
            title="重新开始"
          >
            <RefreshCw size={14} />
          </div>

          <div
            className="w-[140px] h-[140px] rounded-full relative flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
            style={{
              background: `conic-gradient(#10b981 ${pomoPercent}%, #e5e7eb ${pomoPercent}%)`
            }}
            onClick={togglePomo}
          >
            <div className="w-[124px] h-[124px] bg-white rounded-full flex flex-col items-center justify-center relative">
              <div className={`text-4xl font-bold transition-colors ${state.pomodoro.running ? 'text-emerald-500' : 'text-gray-300'}`}>
                {m}:{s}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                总: {state.pomodoro.count} | 完美: {state.pomodoro.perfectCount}
              </div>

              {!state.pomodoro.running && (
                <div className="absolute inset-0 bg-white/85 rounded-full flex items-center justify-center text-emerald-500">
                  <Play size={36} fill="currentColor" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-lg p-3 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-gray-600">睡眠(h)</label>
            <input
              type="number"
              className="border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="8"
              value={localSleep}
              disabled={tasks.sleep !== null}
              onChange={(e) => setLocalSleep(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleTaskSave('sleep', val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(e.currentTarget.value);
                  if (!isNaN(val)) handleTaskSave('sleep', val);
                }
              }}
            />
          </div>
          <div className="flex flex-col text-xs">
            <label className="mb-1 text-gray-600">运动(min)</label>
            <input
              type="number"
              className="border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500 disabled:bg-gray-100 disabled:text-gray-500"
              placeholder="目标:30"
              value={localExercise}
              disabled={tasks.exercise !== null}
              onChange={(e) => setLocalExercise(e.target.value)}
              onBlur={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) handleTaskSave('exercise', val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(e.currentTarget.value);
                  if (!isNaN(val)) handleTaskSave('exercise', val);
                }
              }}
            />
          </div>

          {renderCounterButton('meals', '主食打卡', <Coffee size={14} className="mr-1 text-orange-400"/>)}
          {renderCounterButton('water', '喝水打卡', <Droplet size={14} className="mr-1 text-emerald-400"/>)}
          {renderCounterButton('stretch', '拉伸放松', <Activity size={14} className="mr-1 text-green-500"/>)}
          {renderBooleanButton('nap', '午间小憩', <Moon size={14} className="mr-1 text-indigo-400"/>)}
          {renderCounterButton('meditate', '正念冥想', <Brain size={14} className="mr-1 text-purple-400"/>)}
        </div>
      </div>
    </div>
  );
}
