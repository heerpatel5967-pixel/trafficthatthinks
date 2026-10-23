import React from 'react';
import {
  TrafficCone,
  Cpu,
  ShieldCheck,
  Clock,
  Sliders,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { ConflictMatrix } from '../simulation/conflictMatrix';
import { CongestionScorer } from '../simulation/congestionScoring';

interface SignalControllerViewProps {
  engine: SimulationEngine;
}

export const SignalControllerView: React.FC<SignalControllerViewProps> = ({ engine }) => {
  const signalState = engine.getSignalState();
  const activeApproach = ConflictMatrix.PHASE_TO_APPROACH[signalState.currentPhase];
  const congestion = engine.getCongestion();
  const settings = engine.getSettings();
  const approaches = ['North', 'East', 'South', 'West'] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              SAFETY STATE MACHINE & DECISION ENGINE
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Deterministic Logic
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Adaptive Signal Controller & Safety Finite-State Machine
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Strict 4-phase conflict exclusion with guaranteed yellow clearance, all-red clearance,
            and starvation-resistant adaptive green bounds.
          </p>
        </div>

        {/* Failsafe Safety Status Badge */}
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider">Conflict Invariant</div>
            <div className="text-[11px] font-mono opacity-80">
              100% Conflict-Free | Exactly 1 Green Allowed
            </div>
          </div>
        </div>
      </div>

      {/* Visual Finite State Machine (FSM) Diagram */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Active Signal Safety State Machine Cycle
          </h2>
          <span className="text-xs font-mono text-slate-400">
            Cycle Count: <strong className="text-slate-200">{signalState.cycleCount}</strong> | Changes: <strong className="text-cyan-400">{signalState.totalPhaseChanges}</strong>
          </span>
        </div>

        {/* 4 State Step Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {/* Step 1: GREEN */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              signalState.step === 'GREEN'
                ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20'
                : 'bg-[#0f172a] border-[#1e293b] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STATE 1</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  signalState.step === 'GREEN' ? 'bg-emerald-400 animate-pulse' : 'bg-emerald-800'
                }`}
              ></span>
            </div>
            <div className="text-base font-extrabold text-emerald-300 mt-2">
              GREEN PHASE
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1">
              Active: <span className="font-bold text-white">{activeApproach.toUpperCase()}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
              <span>Duration:</span>
              <span className="text-cyan-300 font-bold">
                {signalState.step === 'GREEN' ? `${signalState.elapsedInStep.toFixed(1)}s / ${signalState.targetStepDuration.toFixed(1)}s` : `${settings.minGreenSeconds}-${settings.maxGreenSeconds}s`}
              </span>
            </div>
          </div>

          {/* Step 2: YELLOW */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              signalState.step === 'YELLOW'
                ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-[#0f172a] border-[#1e293b] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STATE 2</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  signalState.step === 'YELLOW' ? 'bg-amber-400 animate-ping' : 'bg-amber-800'
                }`}
              ></span>
            </div>
            <div className="text-base font-extrabold text-amber-300 mt-2">
              YELLOW CLEARANCE
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1">
              Outgoing: <span className="font-bold text-white">{activeApproach.toUpperCase()}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
              <span>Interval:</span>
              <span className="text-amber-300 font-bold">
                {signalState.step === 'YELLOW' ? `${signalState.elapsedInStep.toFixed(1)}s / ${settings.yellowDurationSeconds}s` : `${settings.yellowDurationSeconds}.0s fixed`}
              </span>
            </div>
          </div>

          {/* Step 3: ALL_RED */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              signalState.step === 'ALL_RED'
                ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/20'
                : 'bg-[#0f172a] border-[#1e293b] opacity-60'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STATE 3</span>
              <span
                className={`w-3 h-3 rounded-full ${
                  signalState.step === 'ALL_RED' ? 'bg-rose-500 animate-pulse' : 'bg-rose-900'
                }`}
              ></span>
            </div>
            <div className="text-base font-extrabold text-rose-300 mt-2">
              ALL-RED CLEARANCE
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1">
              All 4 Approaches: <span className="font-bold text-rose-400">RED</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
              <span>Interval:</span>
              <span className="text-rose-300 font-bold">
                {signalState.step === 'ALL_RED' ? `${signalState.elapsedInStep.toFixed(1)}s / ${settings.allRedDurationSeconds}s` : `${settings.allRedDurationSeconds}.0s fixed`}
              </span>
            </div>
          </div>

          {/* Step 4: NEXT_GREEN */}
          <div className="p-4 rounded-xl border bg-[#0f172a] border-[#1e293b] opacity-80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-400">STATE 4</span>
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
            </div>
            <div className="text-base font-extrabold text-cyan-300 mt-2">
              NEXT GREEN ASSIGNMENT
            </div>
            <div className="text-xs text-slate-300 font-mono mt-1">
              Candidate: <span className="font-bold text-cyan-400">{signalState.nextPhaseCandidate ? signalState.nextPhaseCandidate.replace('Phase_', '') : 'Dynamic Rank'}</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-700/50 flex justify-between">
              <span>Policy:</span>
              <span className="text-slate-300 font-bold">Emergency / Congestion</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Congestion Model Formula & Live Calculation Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Transparent Decision Model & Live Heuristic Formula
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Input variables are normalized, clamped, and weighted without black-box distortion.
            </p>
          </div>
          <div className="px-3 py-1 rounded-lg bg-[#111c33] border border-[#1f2f54] text-xs font-mono text-cyan-300">
            Score = 0.50×Queue + 0.30×Volume + 0.20×SpeedReduction
          </div>
        </div>

        {/* Per-Approach Live Formula Telemetry Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[11px] font-mono uppercase bg-[#111c33] text-slate-400 border-b border-[#1f2f54]">
              <tr>
                <th className="py-2.5 px-3">Approach</th>
                <th className="py-2.5 px-3">Signal State</th>
                <th className="py-2.5 px-3">Queue Severity (50%)</th>
                <th className="py-2.5 px-3">Volume Score (30%)</th>
                <th className="py-2.5 px-3">Speed Reduction (20%)</th>
                <th className="py-2.5 px-3">Starvation Wait</th>
                <th className="py-2.5 px-3">Composite Score</th>
                <th className="py-2.5 px-3">Bounded Green</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#17233f] font-mono">
              {approaches.map((app) => {
                const c = congestion[app];
                const light = signalState.lights[app];
                const isGreen = light === 'GREEN';

                // Bounded green formula calculation
                const ratio = Math.max(0, Math.min(1, c.totalScore / 100));
                const boundedGreen = Math.round(
                  settings.minGreenSeconds + ratio * (settings.maxGreenSeconds - settings.minGreenSeconds)
                );

                return (
                  <tr
                    key={app}
                    className={isGreen ? 'bg-emerald-950/20 text-emerald-200' : 'hover:bg-slate-800/40'}
                  >
                    <td className="py-3 px-3 font-bold flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          light === 'GREEN'
                            ? 'bg-emerald-400'
                            : light === 'YELLOW'
                            ? 'bg-amber-400'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                      {app}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          light === 'GREEN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : light === 'YELLOW'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {light}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      {c.queueSeverity.toFixed(1)}% ({c.queueCount} veh / {c.queueMetres}m)
                    </td>
                    <td className="py-3 px-3">
                      {c.volumeScore.toFixed(1)}% ({c.vehicleCount} on road)
                    </td>
                    <td className="py-3 px-3">
                      {c.speedReduction.toFixed(1)}% ({c.avgSpeedKmh.toFixed(0)} km/h)
                    </td>
                    <td className="py-3 px-3">
                      {c.starvationTimer.toFixed(0)}s {c.starvationTimer > 40 && <span className="text-amber-400">(!Boost)</span>}
                    </td>
                    <td className="py-3 px-3 font-bold text-cyan-300">
                      {c.totalScore.toFixed(1)} / 100
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-bold">
                      {boundedGreen}s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
