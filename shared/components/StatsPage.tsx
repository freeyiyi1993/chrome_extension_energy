import { useEffect, useRef, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { type StorageData, type CompactLog } from '../types';
import { getLogicalDate } from '../utils/time';
import { Chart, LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend } from 'chart.js';
import LogBrowser from './LogBrowser';

Chart.register(LineController, LineElement, PointElement, LinearScale, Title, CategoryScale, Tooltip, Legend);

interface Props {
  data: StorageData;
  onBack: () => void;
}

export default function StatsPage({ data, onBack }: Props) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const todayChartRef = useRef<HTMLCanvasElement>(null);
  const todayChartInstance = useRef<Chart | null>(null);
  const [chartTab, setChartTab] = useState<'today' | 'trend'>('today');

  const dataResetAt = data.dataResetAt || 0;

  useEffect(() => {
    if (!chartRef.current) return;

    const resetDateStr = dataResetAt ? new Date(dataResetAt).toLocaleDateString('en-CA') : '';
    const stats = (data.stats || []).filter(s => !resetDateStr || s.date >= resetDateStr);
    const recentStats = stats.slice(-6);
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone });

    const todayPomoCount = data.state ? (data.state.pomoCount || 0) : 0;
    const todayPerfectCount = data.state ? (data.state.pomoPerfectCount || 0) : 0;
    const todayEnergyConsumed = data.state ? (data.state.energyConsumed || 0) : 0;
    const todayMaxEnergy = data.state ? data.state.maxEnergy : 0;

    const chartData = [...recentStats, {
      date: `${todayStr} (今日)`,
      maxEnergy: todayMaxEnergy,
      energyConsumed: todayEnergyConsumed,
      pomoCount: todayPomoCount,
      perfectCount: todayPerfectCount
    }];

    const labels = chartData.map(s => s.date.substring(5));
    const maxEnergyData = chartData.map(s => s.maxEnergy);
    const consumedData = chartData.map(s => Number(s.energyConsumed.toFixed(1)));
    const pomoData = chartData.map(s => s.pomoCount);
    const perfectData = chartData.map(s => s.perfectCount);

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: '精力上限', data: maxEnergyData, borderColor: '#10b981', tension: 0.3, yAxisID: 'y' },
          { label: '消耗总值', data: consumedData, borderColor: '#ef4444', tension: 0.3, yAxisID: 'y' },
          { label: '番茄数', data: pomoData, borderColor: '#34d399', borderDash: [5, 5], tension: 0.3, yAxisID: 'y1' },
          { label: '完美番茄数', data: perfectData, borderColor: '#f59e0b', borderDash: [5, 5], tension: 0.3, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
        scales: {
          y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '精力值', font: { size: 10 } } },
          y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: '番茄数', font: { size: 10 } } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  // 当天精力流失折线图（逐分钟）
  useEffect(() => {
    if (!todayChartRef.current || !data.state) return;

    const maxEnergy = data.state.maxEnergy;
    const curEnergy = data.state.energy;
    const now = Date.now();

    const [y, m, d] = getLogicalDate().split('-').map(Number);
    const today8AM = new Date(y, m - 1, d, 8, 0, 0).getTime();

    const todayLogs = (data.logs || [])
      .filter((log): log is CompactLog => Array.isArray(log) && log.length === 4 && log[0] >= today8AM && log[0] <= now)
      .sort((a, b) => a[0] - b[0]);

    const diffByMin: Record<number, number> = {};
    for (const log of todayLogs) {
      const minKey = Math.floor((log[0] - today8AM) / 60000);
      diffByMin[minKey] = (diffByMin[minKey] || 0) + log[3];
    }

    const totalDiffs = todayLogs.reduce((sum, log) => sum + log[3], 0);
    const totalDecay = maxEnergy + totalDiffs - curEnergy;
    const totalMins = Math.max(1, Math.floor((now - today8AM) / 60000));

    const labels: string[] = [];
    const energyData: number[] = [];
    let cumDiffs = 0;
    for (let i = 0; i <= totalMins; i++) {
      if (diffByMin[i]) cumDiffs += diffByMin[i];
      const decay = totalDecay * (i / totalMins);
      const e = maxEnergy + cumDiffs - decay;

      const t = new Date(today8AM + i * 60000);
      const h = t.getHours();
      const min = t.getMinutes();
      labels.push(min === 0 ? `${h}:00` : '');
      energyData.push(Number(e.toFixed(1)));
    }

    if (todayChartInstance.current) todayChartInstance.current.destroy();

    todayChartInstance.current = new Chart(todayChartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: '精力值',
          data: energyData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59,130,246,0.1)',
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 1.5,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { max: Math.ceil(maxEnergy * 1.1), title: { display: true, text: '精力', font: { size: 10 } }, ticks: { font: { size: 10 } } },
          x: { ticks: { font: { size: 9 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 12 } }
        }
      }
    });

    return () => { if (todayChartInstance.current) todayChartInstance.current.destroy(); };
  }, [data]);

  return (
    <div className="animate-[fadeIn_0.2s_ease]">
      <div className="flex items-center mb-3 px-1">
        <div className="cursor-pointer text-gray-600 flex items-center gap-1 text-sm font-bold transition-colors hover:text-gray-900" onClick={onBack}>
          <ChevronLeft size={18} /> 返回
        </div>
        <div className="flex-1 text-center font-bold text-base text-gray-800 mr-10">数据统计</div>
      </div>

      <div className="bg-white rounded-lg p-2.5 shadow-sm">
        <div className="flex justify-center mb-2">
          <div className="inline-flex rounded-md overflow-hidden border border-gray-200">
            <button
              className={`text-xs px-3 py-1 transition-colors ${chartTab === 'today' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setChartTab('today')}
            >今日精力</button>
            <button
              className={`text-xs px-3 py-1 transition-colors border-l border-gray-200 ${chartTab === 'trend' ? 'bg-blue-500 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              onClick={() => setChartTab('trend')}
            >历史趋势</button>
          </div>
        </div>

        <div className="w-full h-[160px] mb-3" style={{ display: chartTab === 'trend' ? 'block' : 'none' }}>
          <canvas ref={chartRef}></canvas>
        </div>
        <div className="w-full h-[160px] mb-3" style={{ display: chartTab === 'today' ? 'block' : 'none' }}>
          <canvas ref={todayChartRef}></canvas>
        </div>

        <LogBrowser data={data} dataResetAt={dataResetAt} />
      </div>
    </div>
  );
}
