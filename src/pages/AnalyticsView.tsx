import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { Download, FileJson, Layers, Clock, TrendingUp, BarChart2 } from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';

interface AnalyticsViewProps {
  engine: SimulationEngine;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ engine }) => {
  const metrics = engine.getMetrics();
  const history = metrics.history;
  const congestion = engine.getCongestion();

  // Export CSV
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = 'Time(s),AvgWait(s),MaxQueue(veh),TotalQueue(veh),Throughput,Congestion_N,Congestion_E,Congestion_S,Congestion_W\n';
    const rows = history
      .map(
        (h) =>
          `${h.time},${h.avgWait},${h.maxQueue},${h.totalQueue},${h.throughput},${h.congestionN},${h.congestionE},${h.congestionS},${h.congestionW}`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-analytics-t${Math.floor(engine.getSimTime())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON
  const handleExportJSON = () => {
    const data = {
      simTime: engine.getSimTime(),
      metrics,
      congestion,
      history,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-analytics-t${Math.floor(engine.getSimTime())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const approachBarData = [
    { approach: 'North', score: congestion.North.totalScore, queue: congestion.North.queueCount, vehicles: congestion.North.vehicleCount },
    { approach: 'East', score: congestion.East.totalScore, queue: congestion.East.queueCount, vehicles: congestion.East.vehicleCount },
    { approach: 'South', score: congestion.South.totalScore, queue: congestion.South.queueCount, vehicles: congestion.South.vehicleCount },
    { approach: 'West', score: congestion.West.totalScore, queue: congestion.West.queueCount, vehicles: congestion.West.vehicleCount },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header & Export Actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              REAL-TIME PERFORMANCE TELEMETRY
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Congestion Analytics & Empirical Time-Series
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Live time-series data sampled directly from physical vehicle positions, queue formations,
            and intersection throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-[#111c33] hover:bg-[#1a2847] text-slate-200 border border-[#1f2f54] text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            className="px-3.5 py-2 rounded-xl bg-[#111c33] hover:bg-[#1a2847] text-slate-200 border border-[#1f2f54] text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <FileJson className="w-4 h-4 text-blue-400" />
            Export JSON
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <span className="text-xs text-slate-400">Total Throughput</span>
          <div className="text-2xl font-mono font-extrabold text-emerald-400 mt-1">
            {metrics.totalThroughput} <span className="text-xs font-normal text-slate-400">vehicles</span>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <span className="text-xs text-slate-400">Average Waiting Time</span>
          <div className="text-2xl font-mono font-extrabold text-amber-300 mt-1">
            {metrics.avgWaitingTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">sec</span>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <span className="text-xs text-slate-400">Peak Queue Length</span>
          <div className="text-2xl font-mono font-extrabold text-rose-400 mt-1">
            {metrics.maxQueueLength} <span className="text-xs font-normal text-slate-400">veh</span>
          </div>
        </div>
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <span className="text-xs text-slate-400">Phase Cycles Completed</span>
          <div className="text-2xl font-mono font-extrabold text-cyan-400 mt-1">
            {metrics.phaseChangeCount} <span className="text-xs font-normal text-slate-400">transitions</span>
          </div>
        </div>
      </div>

      {/* Chart 1: Average Waiting Time & Throughput Trend */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-cyan-400" />
          Average Waiting Time & Cumulative Throughput Over Time
        </h2>
        <div className="h-64 w-full">
          {history.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f54" opacity={0.5} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Simulation Time (s)', position: 'insideBottom', offset: -5, fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2f54', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="avgWait" name="Avg Wait (s)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="throughput" name="Throughput (veh)" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
              Collecting time-series data... (runs continuously with simulation)
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Congestion Scores by Approach Bar Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-cyan-400" />
            Instantaneous Congestion Score by Approach (0–100)
          </h2>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={approachBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2f54" opacity={0.5} />
                <XAxis dataKey="approach" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2f54', fontSize: '11px' }} />
                <Bar dataKey="score" name="Congestion Score" fill="#00f2fe" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Queue Lengths Trend */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-rose-400" />
            Total Queue Length Over Time
          </h2>
          <div className="h-56 w-full">
            {history.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2f54" opacity={0.5} />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1f2f54', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="totalQueue" name="Total Queue (veh)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="maxQueue" name="Max Approach Queue" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Accumulating queue samples...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
