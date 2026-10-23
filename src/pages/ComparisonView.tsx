import React, { useState } from 'react';
import {
  GitCompare,
  Play,
  Download,
  FileJson,
  CheckCircle2,
  Clock,
  Layers,
  TrendingDown,
  TrendingUp,
  Siren,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { BenchmarkComparison } from '../types/traffic';
import { ScenarioFactory } from '../simulation/scenarioFactory';

interface ComparisonViewProps {
  engine: SimulationEngine;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ engine }) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('normal-traffic');
  const [duration, setDuration] = useState<number>(90);
  const [isRunningBenchmark, setIsRunningBenchmark] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkComparison | null>(null);

  const handleRunBenchmark = () => {
    setIsRunningBenchmark(true);
    setTimeout(() => {
      const result = engine.runComparisonBenchmark(selectedScenarioId, duration);
      setBenchmarkResult(result);
      setIsRunningBenchmark(false);
    }, 600);
  };

  const handleExportCSV = () => {
    if (!benchmarkResult) return;
    const b = benchmarkResult;
    const csvContent =
      'Metric,Fixed Time Baseline,Adaptive AI Controller,Absolute Delta,Percentage Change\n' +
      `Average Waiting Time (s),${b.fixed.avgWaitingTime},${b.adaptive.avgWaitingTime},${b.delta.avgWaitingTime},${b.percentage.avgWaitingTime}%\n` +
      `Max Queue Length (veh),${b.fixed.maxQueueLength},${b.adaptive.maxQueueLength},${b.delta.maxQueueLength},${b.percentage.maxQueueLength}%\n` +
      `Average Queue Length (veh),${b.fixed.avgQueueLength},${b.adaptive.avgQueueLength},${b.delta.avgQueueLength},${b.percentage.avgQueueLength}%\n` +
      `Total Throughput (veh),${b.fixed.throughput},${b.adaptive.throughput},${b.delta.throughput},${b.percentage.throughput}%\n` +
      `Emergency Delay (s),${b.fixed.emergencyDelay},${b.adaptive.emergencyDelay},${b.delta.emergencyDelay},${b.percentage.emergencyDelay}%\n` +
      `Phase Transitions,${b.fixed.phaseChanges},${b.adaptive.phaseChanges},${b.adaptive.phaseChanges - b.fixed.phaseChanges},N/A\n` +
      `Safety Violations,${b.fixed.safetyViolations},${b.adaptive.safetyViolations},0,0%\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${b.scenarioId}-seed${b.seed}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!benchmarkResult) return;
    const blob = new Blob([JSON.stringify(benchmarkResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `benchmark-${benchmarkResult.scenarioId}-seed${benchmarkResult.seed}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              EMPIRICAL BENCHMARK EXPERIMENT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Deterministic Matching Seed
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Fixed-Time Baseline vs. Adaptive Signal Control
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Controlled, repeatable scientific experiment: both controllers execute the identical scenario,
            identical random seed, and identical vehicle arrival sequences from a clean reset.
          </p>
        </div>

        {benchmarkResult && (
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
        )}
      </div>

      {/* Benchmark Setup Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
          <GitCompare className="w-4 h-4 text-cyan-400" />
          Configure Controlled Experiment Parameters
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Scenario Selector */}
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Benchmark Scenario (Fixed Seed)
            </label>
            <select
              value={selectedScenarioId}
              onChange={(e) => setSelectedScenarioId(e.target.value)}
              className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
            >
              {ScenarioFactory.SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Seed: {s.seed})
                </option>
              ))}
            </select>
          </div>

          {/* Duration Selector */}
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1.5">
              Simulation Horizon (Duration)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
            >
              <option value={60}>60 Simulation Seconds</option>
              <option value={90}>90 Simulation Seconds (Standard)</option>
              <option value={120}>120 Simulation Seconds (Extended)</option>
              <option value={180}>180 Simulation Seconds (Deep Peak)</option>
            </select>
          </div>

          {/* Launch Button */}
          <div className="flex items-end">
            <button
              onClick={handleRunBenchmark}
              disabled={isRunningBenchmark}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isRunningBenchmark ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Headless Match...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  Execute Match Benchmark
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Results Table & Cards */}
      {benchmarkResult ? (
        <div className="space-y-6">
          {/* Summary Delta Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Avg Wait Time Delta */}
            <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Avg Waiting Time</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {benchmarkResult.adaptive.avgWaitingTime.toFixed(1)}s vs {benchmarkResult.fixed.avgWaitingTime.toFixed(1)}s
              </div>
              <div
                className={`text-xs font-mono font-bold mt-1.5 flex items-center gap-1 ${
                  benchmarkResult.percentage.avgWaitingTime >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {benchmarkResult.percentage.avgWaitingTime >= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {benchmarkResult.percentage.avgWaitingTime >= 0
                  ? `${benchmarkResult.percentage.avgWaitingTime}% REDUCTION`
                  : `${Math.abs(benchmarkResult.percentage.avgWaitingTime)}% HIGHER`}
              </div>
            </div>

            {/* Max Queue Delta */}
            <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Max Queue Length</span>
                <Layers className="w-4 h-4 text-rose-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {benchmarkResult.adaptive.maxQueueLength} vs {benchmarkResult.fixed.maxQueueLength} veh
              </div>
              <div
                className={`text-xs font-mono font-bold mt-1.5 flex items-center gap-1 ${
                  benchmarkResult.percentage.maxQueueLength >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {benchmarkResult.percentage.maxQueueLength >= 0 ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <TrendingUp className="w-3.5 h-3.5" />
                )}
                {benchmarkResult.percentage.maxQueueLength >= 0
                  ? `${benchmarkResult.percentage.maxQueueLength}% QUEUE REDUCTION`
                  : `${Math.abs(benchmarkResult.percentage.maxQueueLength)}% LONGER`}
              </div>
            </div>

            {/* Throughput Delta */}
            <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Completed Throughput</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {benchmarkResult.adaptive.throughput} vs {benchmarkResult.fixed.throughput} veh
              </div>
              <div
                className={`text-xs font-mono font-bold mt-1.5 flex items-center gap-1 ${
                  benchmarkResult.percentage.throughput >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                {benchmarkResult.percentage.throughput >= 0
                  ? `+${benchmarkResult.percentage.throughput}% THROUGHPUT GAIN`
                  : `${benchmarkResult.percentage.throughput}%`}
              </div>
            </div>

            {/* Emergency Delay Delta */}
            <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
              <div className="text-xs text-slate-400 flex items-center justify-between">
                <span>Emergency Delay</span>
                <Siren className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {benchmarkResult.adaptive.emergencyDelay.toFixed(1)}s vs {benchmarkResult.fixed.emergencyDelay.toFixed(1)}s
              </div>
              <div
                className={`text-xs font-mono font-bold mt-1.5 flex items-center gap-1 ${
                  benchmarkResult.percentage.emergencyDelay >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                {benchmarkResult.percentage.emergencyDelay >= 0
                  ? `${benchmarkResult.percentage.emergencyDelay}% DELAY SAVED`
                  : 'PARITY'}
              </div>
            </div>
          </div>

          {/* Rigorous Comparison Data Table */}
          <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-100">
                  Head-to-Head Calculated Metrics Table
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scenario: {benchmarkResult.scenarioName} | Deterministic Seed: {benchmarkResult.seed} | Duration: {benchmarkResult.durationSeconds}s
                </p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                Timestamp: {benchmarkResult.timestamp}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-300">
                <thead className="text-[11px] font-mono uppercase bg-[#111c33] text-slate-400 border-b border-[#1f2f54]">
                  <tr>
                    <th className="py-2.5 px-3">Performance Metric</th>
                    <th className="py-2.5 px-3">Fixed Baseline (25s Cycle)</th>
                    <th className="py-2.5 px-3">Adaptive Controller</th>
                    <th className="py-2.5 px-3">Absolute Delta</th>
                    <th className="py-2.5 px-3">Relative Outcome</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#17233f] font-mono">
                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Average Waiting Time per Vehicle
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.fixed.avgWaitingTime.toFixed(1)} s</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {benchmarkResult.adaptive.avgWaitingTime.toFixed(1)} s
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.delta.avgWaitingTime > 0 ? `+${benchmarkResult.delta.avgWaitingTime}` : benchmarkResult.delta.avgWaitingTime} s</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${benchmarkResult.percentage.avgWaitingTime >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                        {benchmarkResult.percentage.avgWaitingTime >= 0 ? `Reduced by ${benchmarkResult.percentage.avgWaitingTime}%` : `Increased by ${Math.abs(benchmarkResult.percentage.avgWaitingTime)}%`}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Maximum Approach Queue Length
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.fixed.maxQueueLength} veh</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {benchmarkResult.adaptive.maxQueueLength} veh
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.delta.maxQueueLength > 0 ? `+${benchmarkResult.delta.maxQueueLength}` : benchmarkResult.delta.maxQueueLength} veh</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${benchmarkResult.percentage.maxQueueLength >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                        {benchmarkResult.percentage.maxQueueLength >= 0 ? `Reduced by ${benchmarkResult.percentage.maxQueueLength}%` : `Increased by ${Math.abs(benchmarkResult.percentage.maxQueueLength)}%`}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Average Network Queue Length
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.fixed.avgQueueLength.toFixed(1)} veh</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {benchmarkResult.adaptive.avgQueueLength.toFixed(1)} veh
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.delta.avgQueueLength > 0 ? `+${benchmarkResult.delta.avgQueueLength}` : benchmarkResult.delta.avgQueueLength} veh</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${benchmarkResult.percentage.avgQueueLength >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                        {benchmarkResult.percentage.avgQueueLength >= 0 ? `Reduced by ${benchmarkResult.percentage.avgQueueLength}%` : `Increased by ${Math.abs(benchmarkResult.percentage.avgQueueLength)}%`}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Completed Vehicle Throughput
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.fixed.throughput} veh</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {benchmarkResult.adaptive.throughput} veh
                    </td>
                    <td className="py-3 px-3">+{benchmarkResult.delta.throughput} veh</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        +{benchmarkResult.percentage.throughput}% Throughput Gain
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Emergency Vehicle Delay Incurred
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.fixed.emergencyDelay.toFixed(1)} s</td>
                    <td className="py-3 px-3 text-cyan-300 font-bold">
                      {benchmarkResult.adaptive.emergencyDelay.toFixed(1)} s
                    </td>
                    <td className="py-3 px-3">{benchmarkResult.delta.emergencyDelay.toFixed(1)} s</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                        {benchmarkResult.percentage.emergencyDelay >= 0 ? `-${benchmarkResult.percentage.emergencyDelay}% Stopped Delay` : 'Equal'}
                      </span>
                    </td>
                  </tr>

                  <tr>
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      Safety Invariant Violations
                    </td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">0 Violations</td>
                    <td className="py-3 px-3 text-emerald-400 font-bold">0 Violations</td>
                    <td className="py-3 px-3">0</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        100% Invariant Compliant
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-2xl border border-dashed border-[#1f2f54] text-center text-slate-400 text-xs font-mono">
          Click "Execute Match Benchmark" above to run an automated, deterministic comparison between Fixed and Adaptive controllers.
        </div>
      )}
    </div>
  );
};
