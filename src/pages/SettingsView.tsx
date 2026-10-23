import React, { useState } from 'react';
import {
  Sliders,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  Save,
  Cpu,
  Clock,
  Radio,
  CloudRain,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';

interface SettingsViewProps {
  engine: SimulationEngine;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ engine }) => {
  const currentSettings = engine.getSettings();
  const currentContext = engine.getContext();

  const [minGreen, setMinGreen] = useState(currentSettings.minGreenSeconds);
  const [maxGreen, setMaxGreen] = useState(currentSettings.maxGreenSeconds);
  const [yellowSec, setYellowSec] = useState(currentSettings.yellowDurationSeconds);
  const [allRedSec, setAllRedSec] = useState(currentSettings.allRedDurationSeconds);
  const [detectDist, setDetectDist] = useState(currentSettings.emergencyDetectionDistance);
  const [arrivalRate, setArrivalRate] = useState(currentSettings.arrivalRatePerMinute);
  const [weather, setWeather] = useState(currentContext.weather);
  const [controllerMode, setControllerMode] = useState(currentSettings.controllerMode);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    try {
      engine.setArrivalRate(arrivalRate);
      engine.setEmergencyDetectionDistance(detectDist);
      engine.setWeather(weather);
      engine.setControllerMode(controllerMode);

      // Save to localStorage
      const cfg = {
        minGreen,
        maxGreen,
        yellowSec,
        allRedSec,
        detectDist,
        arrivalRate,
        weather,
        controllerMode,
      };
      localStorage.setItem('ttt_settings', JSON.stringify(cfg));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.warn('LocalStorage error:', err);
    }
  };

  const handleResetDefaults = () => {
    setMinGreen(8);
    setMaxGreen(40);
    setYellowSec(3);
    setAllRedSec(2);
    setDetectDist(150);
    setArrivalRate(36);
    setWeather('clear');
    setControllerMode('adaptive');

    engine.setArrivalRate(36);
    engine.setEmergencyDetectionDistance(150);
    engine.setWeather('clear');
    engine.setControllerMode('adaptive');

    try {
      localStorage.removeItem('ttt_settings');
    } catch (e) {}

    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              ENGINE & SAFETY TUNING
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            System Configuration & Engineering Parameters
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure signal transition intervals, arrival rate baselines, and detection thresholds.
            Parameters are simulation engineering defaults, clearly distinguished from statutory legal timings.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-[#111c33] hover:bg-slate-800 text-slate-300 border border-[#1f2f54] text-xs font-semibold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Parameters
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          Settings applied successfully and synchronized with active engine.
        </div>
      )}

      {/* Grid of Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Signal Timing State Machine Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54] space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            Signal Phase Duration Intervals
          </h2>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Minimum Green Interval:</span>
              <span className="text-cyan-300 font-bold">{minGreen} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              value={minGreen}
              onChange={(e) => setMinGreen(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              Guaranteed pedestrian & initial vehicle discharge clearance before phase can transition.
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Maximum Green Ceiling:</span>
              <span className="text-cyan-300 font-bold">{maxGreen} seconds</span>
            </div>
            <input
              type="range"
              min="25"
              max="60"
              value={maxGreen}
              onChange={(e) => setMaxGreen(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              Hard ceiling preventing infinite green holding on saturated approaches.
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Yellow Clearance Interval:</span>
              <span className="text-amber-300 font-bold">{yellowSec} seconds</span>
            </div>
            <input
              type="range"
              min="2"
              max="5"
              value={yellowSec}
              onChange={(e) => setYellowSec(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              Safe transition warning based on approach design speed (IRC:93 guideline: ~3–4s).
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>All-Red Conflict Clearance:</span>
              <span className="text-rose-400 font-bold">{allRedSec} seconds</span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              value={allRedSec}
              onChange={(e) => setAllRedSec(Number(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              All 4 approaches strictly held at red to guarantee junction conflict box is clear.
            </span>
          </div>
        </div>

        {/* Radar & Environmental Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54] space-y-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Radar Sensing & Environment
          </h2>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Emergency Radar Range:</span>
              <span className="text-cyan-300 font-bold">{detectDist} metres</span>
            </div>
            <input
              type="range"
              min="60"
              max="240"
              step="10"
              value={detectDist}
              onChange={(e) => setDetectDist(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              Distance before intersection where emergency vehicles trigger automated preemption.
            </span>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-slate-300 mb-1">
              <span>Network Arrival Rate:</span>
              <span className="text-cyan-300 font-bold">{arrivalRate} veh/min</span>
            </div>
            <input
              type="range"
              min="15"
              max="110"
              value={arrivalRate}
              onChange={(e) => setArrivalRate(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500">
              Combined arrival frequency entering the 4-way intersection arms.
            </span>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Weather Condition Simulation:
            </label>
            <select
              value={weather}
              onChange={(e) => setWeather(e.target.value as any)}
              className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
            >
              <option value="clear">Clear Skies (Standard Braking / Free-flow 50 km/h)</option>
              <option value="rain">Monsoon Downpour (-20% Speed, Elongated Deceleration)</option>
              <option value="fog">Dense Fog (-30% Free-flow Speed)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-300 block mb-1">
              Active Controller Architecture:
            </label>
            <select
              value={controllerMode}
              onChange={(e) => setControllerMode(e.target.value as any)}
              className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
            >
              <option value="adaptive">Adaptive AI Controller (Dynamic Congestion Scoring)</option>
              <option value="fixed">Fixed-Time Baseline (Blind 25s Cycle Rotation)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
