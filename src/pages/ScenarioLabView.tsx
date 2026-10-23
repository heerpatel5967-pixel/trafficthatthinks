import React, { useState } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  CloudRain,
  AlertTriangle,
  Siren,
  Sliders,
  CheckCircle2,
  Sparkles,
  Users,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { ScenarioFactory } from '../simulation/scenarioFactory';
import { ScenarioDefinition } from '../types/traffic';

interface ScenarioLabViewProps {
  engine: SimulationEngine;
  onNavigateToSim: () => void;
}

export const ScenarioLabView: React.FC<ScenarioLabViewProps> = ({
  engine,
  onNavigateToSim,
}) => {
  const activeScenario = engine.getCurrentScenario();
  const [customSeed, setCustomSeed] = useState<number>(activeScenario.seed);
  const [customArrivalRate, setCustomArrivalRate] = useState<number>(activeScenario.arrivalRate);
  const [loadedNotification, setLoadedNotification] = useState<string | null>(null);

  const handleLoadScenario = (sc: ScenarioDefinition) => {
    engine.loadScenario(sc.id);
    setCustomSeed(sc.seed);
    setCustomArrivalRate(sc.arrivalRate);
    setLoadedNotification(`Loaded "${sc.name}" (Seed: ${sc.seed}). Initial state restored.`);
    setTimeout(() => setLoadedNotification(null), 3000);
  };

  const handleApplyCustom = () => {
    engine.setArrivalRate(customArrivalRate);
    engine.reset(customSeed);
    setLoadedNotification(`Applied Custom Seed #${customSeed} at ${customArrivalRate} veh/min.`);
    setTimeout(() => setLoadedNotification(null), 3000);
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              REPRODUCIBLE EXPERIMENTATION LAB
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              10 Documented Benchmarks
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Scenario Laboratory & Deterministic Benchmarks
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Choose from 10 one-click standardized test scenarios with pinned pseudo-random seeds,
            or customize road parameters for stress testing.
          </p>
        </div>

        {loadedNotification && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            {loadedNotification}
          </div>
        )}
      </div>

      {/* Grid of 10 Standardized Scenarios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ScenarioFactory.SCENARIOS.map((sc) => {
          const isActive = activeScenario.id === sc.id;

          return (
            <div
              key={sc.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-gradient-to-br from-cyan-950/40 to-[#0e172a] border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#0e1628] border-[#1d2a48] hover:border-slate-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-cyan-300 border border-cyan-500/20">
                    Seed: {sc.seed}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                      sc.category === 'Emergency'
                        ? 'bg-rose-500/15 text-rose-300'
                        : sc.category === 'Adverse Weather'
                        ? 'bg-cyan-500/15 text-cyan-300'
                        : sc.category === 'Disruption'
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {sc.category}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-100 mt-2.5">
                  {sc.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {sc.description}
                </p>

                {/* Scenario details pills */}
                <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono text-slate-300">
                  <span className="bg-[#121c33] px-2 py-0.5 rounded border border-[#1f2f54]">
                    Rate: {sc.arrivalRate} veh/min
                  </span>
                  <span className="bg-[#121c33] px-2 py-0.5 rounded border border-[#1f2f54]">
                    Weather: {sc.weather}
                  </span>
                  {sc.incidentApproach && (
                    <span className="bg-amber-950/40 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      Incident: {sc.incidentApproach}
                    </span>
                  )}
                  {sc.emergencyVehicle && (
                    <span className="bg-rose-950/40 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                      {sc.emergencyVehicle.type} ({sc.emergencyVehicle.approach})
                    </span>
                  )}
                </div>
              </div>

              {/* Action button */}
              <div className="mt-4 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {isActive ? '● Currently Active' : 'Ready to Load'}
                </span>
                <button
                  onClick={() => handleLoadScenario(sc)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {isActive ? 'Reset Scenario' : 'Load Scenario'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Scenario Sandbox Slider Panel */}
      <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          Custom Seed & Parameter Sandbox
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Custom Seed (Deterministic PRNG)
            </label>
            <input
              type="number"
              value={customSeed}
              onChange={(e) => setCustomSeed(Number(e.target.value))}
              className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Arrival Rate: {customArrivalRate} veh/min
            </label>
            <input
              type="range"
              min="15"
              max="110"
              value={customArrivalRate}
              onChange={(e) => setCustomArrivalRate(Number(e.target.value))}
              className="w-full accent-cyan-400 mt-2 cursor-pointer"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyCustom}
              className="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset with Custom Params
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
