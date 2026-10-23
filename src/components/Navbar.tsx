import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  ShieldCheck,
  Siren,
  Sliders,
  Cpu,
  Clock,
  Activity,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { ConflictMatrix } from '../simulation/conflictMatrix';

interface NavbarProps {
  engine: SimulationEngine;
  onOpenSelfTest: () => void;
  onToggleSettings: () => void;
  currentTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  engine,
  onOpenSelfTest,
  onToggleSettings,
}) => {
  const isRunning = engine.getIsRunning();
  const simTime = engine.getSimTime();
  const signalState = engine.getSignalState();
  const activeApproach = ConflictMatrix.PHASE_TO_APPROACH[signalState.currentPhase];
  const emergencyMission = engine.getActiveEmergencyMission();
  const settings = engine.getSettings();

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}.${ms}`;
  };

  return (
    <header className="h-16 border-b border-[#1f2f54] bg-[#090f1e]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-sm">
          3T
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-wide text-slate-100 uppercase">
              Traffic That Thinks
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              JU TECHFEST '26
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>SC-01 | Track 02: Smart Cities</span>
            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
            <span className="text-cyan-400/90 font-mono">LHT Indian Convention</span>
          </div>
        </div>
      </div>

      {/* Center: Live Signal Phase & Master Clock Telemetry */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Signal Phase Pill */}
        <div className="px-3 py-1.5 rounded-xl bg-[#111c33] border border-[#1f2f54] flex items-center gap-3 shadow-inner">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                signalState.step === 'GREEN'
                  ? 'bg-emerald-400 animate-pulse'
                  : signalState.step === 'YELLOW'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span className="text-xs font-mono font-bold text-slate-200">
              {signalState.step === 'ALL_RED'
                ? 'ALL-RED CLEARANCE'
                : `${activeApproach.toUpperCase()} [${signalState.step}]`}
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-400 border-l border-slate-700/60 pl-2.5">
            {signalState.elapsedInStep.toFixed(1)}s /{' '}
            {signalState.targetStepDuration.toFixed(1)}s
          </div>
        </div>

        {/* Master Simulation Clock */}
        <div className="px-3 py-1.5 rounded-xl bg-[#111c33] border border-[#1f2f54] flex items-center gap-2 text-xs font-mono text-cyan-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>T+{formatTime(simTime)}</span>
        </div>

        {/* Emergency Alert Indicator Banner */}
        {emergencyMission && emergencyMission.state !== 'CLEARED' && (
          <div className="px-3 py-1 rounded-xl bg-rose-950/60 border border-rose-500/50 flex items-center gap-2 text-xs text-rose-300 font-mono animate-pulse">
            <Siren className="w-4 h-4 text-rose-400 animate-bounce" />
            <span>
              {emergencyMission.type.toUpperCase()} PRIORITY ({emergencyMission.approach})
            </span>
          </div>
        )}
      </div>

      {/* Right: Simulation Controls & Mode Selector */}
      <div className="flex items-center gap-2">
        {/* Controller Mode Toggle */}
        <div className="flex items-center bg-[#111c33] p-1 rounded-lg border border-[#1f2f54] text-xs font-mono">
          <button
            onClick={() => engine.setControllerMode('adaptive')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              settings.controllerMode === 'adaptive'
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3 h-3" />
            Adaptive
          </button>
          <button
            onClick={() => engine.setControllerMode('fixed')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              settings.controllerMode === 'fixed'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            Fixed
          </button>
        </div>

        {/* Sim Speed Select */}
        <div className="hidden sm:flex items-center bg-[#111c33] rounded-lg border border-[#1f2f54] text-xs font-mono overflow-hidden">
          {[1.0, 2.0, 4.0].map((scale) => (
            <button
              key={scale}
              onClick={() => engine.setTimeScale(scale)}
              className={`px-2 py-1 transition-colors ${
                settings.timeScale === scale
                  ? 'bg-slate-700 text-cyan-300 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {scale}x
            </button>
          ))}
        </div>

        {/* Play / Pause / Step Controls */}
        <div className="flex items-center gap-1 bg-[#111c33] p-1 rounded-lg border border-[#1f2f54]">
          <button
            onClick={() => engine.togglePlay()}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-200 transition-colors"
            title={isRunning ? 'Pause Simulation' : 'Resume Simulation'}
          >
            {isRunning ? (
              <Pause className="w-4 h-4 fill-current text-amber-400" />
            ) : (
              <Play className="w-4 h-4 fill-current text-emerald-400" />
            )}
          </button>
          <button
            onClick={() => engine.step(0.1)}
            disabled={isRunning}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
            title="Step 1 Tick (0.1s)"
          >
            <StepForward className="w-4 h-4" />
          </button>
          <button
            onClick={() => engine.reset()}
            className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Self-Test Suite Button */}
        <button
          onClick={onOpenSelfTest}
          className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          title="Run 20 Invariant Safety Checks"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Self-Test</span>
        </button>

        {/* Settings button */}
        <button
          onClick={onToggleSettings}
          className="p-2 rounded-lg bg-[#111c33] hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-[#1f2f54] transition-colors"
          title="System Settings"
        >
          <Sliders className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
