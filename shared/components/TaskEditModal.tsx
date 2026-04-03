import { type CustomTaskDef, type HealLevel, type TaskType } from '../types';

const HEAL_LABELS: Record<HealLevel, string> = {
  none: '不恢复',
  small: '小恢复',
  mid: '中恢复',
  big: '大恢复',
};

const TYPE_LABELS: Record<TaskType, string> = {
  counter: '计数器',
  boolean: '开关',
  number: '数值输入',
};

interface Props {
  task: CustomTaskDef;
  isNew: boolean;
  onChange: (task: CustomTaskDef) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function TaskEditModal({ task, isNew, onChange, onSave, onCancel }: Props) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-4 w-full max-w-[280px] shadow-xl">
        <div className="font-bold text-sm mb-3">{isNew ? '添加任务' : '编辑任务'}</div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-gray-500 block mb-0.5">图标</label>
              <input
                className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
                value={task.icon}
                onChange={e => onChange({ ...task, icon: e.target.value })}
              />
            </div>
            <div className="flex-[2]">
              <label className="text-[10px] text-gray-500 block mb-0.5">名称</label>
              <input
                className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
                value={task.name}
                onChange={e => onChange({ ...task, name: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">类型</label>
            <select
              className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
              value={task.type}
              onChange={e => onChange({ ...task, type: e.target.value as TaskType })}
              disabled={!!task.builtin}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 block mb-0.5">精力恢复等级</label>
            <select
              className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
              value={task.healLevel}
              onChange={e => onChange({ ...task, healLevel: e.target.value as HealLevel })}
            >
              {Object.entries(HEAL_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          {task.type === 'counter' && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-0.5">每日上限次数</label>
              <input
                type="number"
                className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
                value={task.maxCount ?? ''}
                min={1}
                onChange={e => {
                  const raw = e.target.value;
                  onChange({ ...task, maxCount: raw === '' ? undefined : (parseInt(raw) || undefined) } as typeof task);
                }}
                onBlur={() => {
                  if (!task.maxCount || task.maxCount < 1) onChange({ ...task, maxCount: 3 });
                }}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="text-[10px] text-gray-500">计入完美一天</label>
            <button
              className={`text-[10px] px-2 py-0.5 rounded transition-colors ${task.countsForPerfectDay ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}
              onClick={() => onChange({ ...task, countsForPerfectDay: !task.countsForPerfectDay })}
            >
              {task.countsForPerfectDay ? '是' : '否'}
            </button>
          </div>

          {task.type === 'number' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-0.5">单位</label>
                <input
                  className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
                  value={task.unit || ''}
                  onChange={e => onChange({ ...task, unit: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-500 block mb-0.5">占位提示</label>
                <input
                  className="w-full border border-gray-300 rounded p-1 text-xs outline-none focus:border-emerald-500"
                  value={task.placeholder || ''}
                  onChange={e => onChange({ ...task, placeholder: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-3">
          <button
            className="flex-1 bg-gray-100 text-gray-600 py-1.5 rounded text-xs font-bold hover:bg-gray-200 transition-colors"
            onClick={onCancel}
          >
            取消
          </button>
          <button
            className="flex-1 bg-emerald-500 text-white py-1.5 rounded text-xs font-bold hover:bg-emerald-600 transition-colors"
            onClick={onSave}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
