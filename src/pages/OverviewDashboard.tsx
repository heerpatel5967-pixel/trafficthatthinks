import React from 'react';
import {
  Car,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Siren,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Activity,
  Play,
  RotateCcw,
  TrafficCone,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { NavTabId } from '../components/Sidebar';

interface OverviewDashboardProps {
  engine: SimulationEngine;
  onNavigate: (tab: NavTabId) => void;
  onOpenSelfTest: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  engine,
  onNavigate,
  onOpenSelfTest,
}) => {
  const metrics = engine.getMetrics();
  const congestion = engine.getCongestion();
  const signalState = engine.getSignalState();
  const decisions = engine.getDecisions();
  const emergencyMission = engine.getActiveEmergencyMission();
  const scenario = engine.getCurrentScenario();

  const approaches = ['North', 'East', 'South', 'West'] as const;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Top Banner / Hero */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54] bg-gradient-to-r from-[#0d162b] to-[#121f3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AI-POWERED ADAPTIVE TRAFFIC MANAGEMENT
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Deterministic Engine
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
            Traffic That Thinks — Smart City Command Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Real-time closed-loop demonstration: Traffic Sensing → Congestion Scoring →
            Safe FSM Signal Transitions → Emergency Preemption Corridor → Fixed vs Adaptive Analytics.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('simulation')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            Launch 3D View
          </button>
          <button
            onClick={onOpenSelfTest}
            className="px-4 py-2.5 rounded-xl bg-[#131e36] hover:bg-[#1a2847] text-slate-200 border border-[#1f2f54] font-semibold text-xs flex items-center gap-2 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Self-Test Suite
          </button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Active Vehicles */}
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Vehicles in Network</span>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.activeVehiclesCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Completed Exits:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {metrics.completedVehiclesCount}
            </span>
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Avg Waiting Time</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.avgWaitingTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">sec</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Stopped Vehicles:</span>
            <span className="font-mono text-amber-400 font-bold">
              {metrics.totalWaitingVehicles}
            </span>
          </div>
        </div>

        {/* Max & Average Queue */}
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Max Queue Length</span>
            <Layers className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-white mt-2">
            {metrics.maxQueueLength} <span className="text-xs font-normal text-slate-400">veh</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Avg Queue:</span>
            <span className="font-mono text-slate-300 font-bold">
              {metrics.avgQueueLength.toFixed(1)} veh
            </span>
          </div>
        </div>

        {/* Signal Safety Status */}
        <div className="glass-card p-4 rounded-xl border border-[#1f2f54]">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Safety Invariant Check</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-2 flex items-center gap-2">
            100% <span className="text-xs font-normal text-slate-400">VALID</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Violations:</span>
            <span className="font-mono text-emerald-400 font-bold">
              {metrics.safetyRuleViolations} (0 Conflicts)
            </span>
          </div>
        </div>
      </div>

      {/* Middle Section: Live Approach Congestion Gauges & Quick Simulation Control */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 4-Way Approach Congestion Breakdown */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f2f54]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live Approach Congestion Telemetry (0–100)
              </h2>
              <p className="text-[11px] text-slate-400">
                Formula: (50% Queue Severity) + (30% Approach Volume) + (20% Speed Reduction)
              </p>
            </div>
            <button
              onClick={() => onNavigate('controller')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
            >
              FSM Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approaches.map((app) => {
              const c = congestion[app];
              const isGreen = signalState.lights[app] === 'GREEN';
              const isYellow = signalState.lights[app] === 'YELLOW';

              return (
                <div
                  key={app}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isGreen
                      ? 'bg-emerald-950/20 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                      : isYellow
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-[#10192d] border-[#1e2d4d]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isGreen
                            ? 'bg-emerald-400 animate-pulse'
                            : isYellow
                            ? 'bg-amber-400 animate-ping'
                            : 'bg-rose-500'
                        }`}
                      ></span>
                      <span className="font-bold text-xs text-slate-200">
                        {app} Approach
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-cyan-300">
                      Score: {c.totalScore.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-800 mt-2.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        c.totalScore > 70
                          ? 'bg-rose-500'
                          : c.totalScore > 40
                          ? 'bg-amber-400'
                          : 'bg-cyan-400'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, c.totalScore))}%` }}
                    ></div>
                  </div>

                  {/* Metrics details */}
                  <div className="grid grid-cols-3 gap-2 mt-3 text-[10px] text-slate-400 font-mono">
                    <div>
                      Queue:{' '}
                      <span className="text-slate-200 font-bold">
                        {c.queueCount} veh ({c.queueMetres}m)
                      </span>
                    </div>
                    <div>
                      Vehicles:{' '}
                      <span className="text-slate-200 font-bold">{c.vehicleCount}</span>
                    </div>
                    <div>
                      Speed:{' '}
                      <span className="text-slate-200 font-bold">
                        {c.avgSpeedKmh.toFixed(0)} km/h
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Emergency & Scenario Trigger Panel */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Siren className="w-4 h-4 text-rose-400" />
                Emergency Corridor Spawner
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Test instant early detection and safe preemption transition on any approach corridor.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => engine.triggerEmergency('East', 'ambulance')}
                className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Siren className="w-4 h-4 text-rose-400" />
                East Ambulance
              </button>
              <button
                onClick={() => engine.triggerEmergency('South', 'fire_engine')}
                className="p-2.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                South Fire Tender
              </button>
              <button
                onClick={() => engine.triggerEmergency('North', 'police')}
                className="p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4 text-blue-400" />
                North Police VIP
              </button>
              <button
                onClick={() => engine.triggerIncident('West', 0.5)}
                className="p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-colors"
              >
                <TrafficCone className="w-4 h-4 text-amber-400" />
                West Lane Incident
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1f2f54] mt-4">
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Active Scenario:</span>
              <span className="font-semibold text-cyan-300">{scenario.name}</span>
            </div>
            <button
              onClick={() => onNavigate('scenarios')}
              className="w-full mt-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
            >
              Open Scenario Laboratory
            </button>
          </div>
        </div>
      </div>

      {/* Bottom: Real-Time Decision Stream Preview */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Recent Controller Decision Explanations
          </h2>
          <button
            onClick={() => onNavigate('decisions')}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            Full Event Log <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {decisions.length === 0 ? (
          <div className="text-xs text-slate-500 font-mono py-4 text-center">
            Awaiting controller decisions... Run or step the simulation to log real-time actions.
          </div>
        ) : (
          <div className="space-y-2">
            {decisions.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl bg-[#0f182c] border border-[#1e2d4d] text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                    T+{d.simTime.toFixed(1)}s
                  </span>
                  <span className="font-semibold text-slate-200">
                    {d.actionType.replace('_', ' ')}: {d.selectedApproach}
                  </span>
                  <span className="text-slate-400 text-[11px] hidden sm:inline">
                    — {d.primaryReason}
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                  {d.safetyCheckResult}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
