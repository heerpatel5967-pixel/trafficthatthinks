import React, { useState } from 'react';
import {
  Siren,
  ShieldAlert,
  Radio,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Play,
  Zap,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { Approach, VehicleType } from '../types/traffic';

interface EmergencyCommandViewProps {
  engine: SimulationEngine;
}

export const EmergencyCommandView: React.FC<EmergencyCommandViewProps> = ({ engine }) => {
  const [selectedApproach, setSelectedApproach] = useState<Approach>('East');
  const [selectedType, setSelectedType] = useState<'ambulance' | 'fire_engine' | 'police'>('ambulance');

  const emergencyMission = engine.getActiveEmergencyMission();
  const settings = engine.getSettings();

  const handleSpawn = () => {
    engine.triggerEmergency(selectedApproach, selectedType);
  };

  const steps = [
    'SPAWNED',
    'DETECTED',
    'PREEMPTION_REQUESTED',
    'TRANSITIONING',
    'GREEN_GRANTED',
    'CROSSING',
    'CLEARED',
  ];

  const currentStepIndex = emergencyMission
    ? steps.indexOf(emergencyMission.state)
    : -1;

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
              LIFE-CRITICAL RESPONSE PROTOCOL
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Zero-Conflict Corridor
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Emergency Vehicle Early-Detection & Priority Preemption
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Simulates long-range radar/sensor early detection, scheduling safe signal clearance so
            authorized emergency responders receive green upon arrival with zero red-light stops.
          </p>
        </div>

        {/* Status Badge */}
        <div
          className={`p-3 rounded-xl border flex items-center gap-3 ${
            emergencyMission && emergencyMission.state !== 'CLEARED'
              ? 'bg-rose-950/40 border-rose-500/60 text-rose-300 animate-pulse'
              : 'bg-[#111c33] border-[#1f2f54] text-slate-400'
          }`}
        >
          <Siren className="w-5 h-5 text-rose-400" />
          <div>
            <div className="text-xs font-bold uppercase tracking-wider font-mono">
              {emergencyMission && emergencyMission.state !== 'CLEARED' ? 'Preemption Active' : 'Standby Mode'}
            </div>
            <div className="text-[11px] font-mono opacity-80">
              {emergencyMission ? `${emergencyMission.type.toUpperCase()} on ${emergencyMission.approach}` : 'Radar Scanning Road Corridors'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel: Spawner & Radar Range */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Emergency Vehicle Spawner */}
        <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-4">
            <Radio className="w-4 h-4 text-rose-400" />
            Dispatch Simulated Emergency Vehicle
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Type selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">
                Vehicle Type (Priority Tier)
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
              >
                <option value="ambulance">Ambulance (Tier 1 Priority)</option>
                <option value="fire_engine">Fire Tender (Tier 2 Priority)</option>
                <option value="police">Police Cruiser (Tier 3 Priority)</option>
              </select>
            </div>

            {/* Approach selector */}
            <div>
              <label className="text-xs font-mono text-slate-400 block mb-1.5">
                Approach Corridor
              </label>
              <select
                value={selectedApproach}
                onChange={(e) => setSelectedApproach(e.target.value as any)}
                className="w-full bg-[#111c33] border border-[#1f2f54] text-slate-200 text-xs rounded-lg px-3 py-2 font-mono outline-none focus:border-cyan-500"
              >
                <option value="North">North Corridor (Heading South)</option>
                <option value="East">East Corridor (Heading West)</option>
                <option value="South">South Corridor (Heading North)</option>
                <option value="West">West Corridor (Heading East)</option>
              </select>
            </div>

            {/* Spawn trigger button */}
            <div className="flex items-end">
              <button
                onClick={handleSpawn}
                className="w-full py-2 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-bold text-xs rounded-lg shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2"
              >
                <Siren className="w-4 h-4" />
                Dispatch & Trigger
              </button>
            </div>
          </div>
        </div>

        {/* Radar Range Slider */}
        <div className="glass-panel p-5 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            Upstream Radar Distance
          </h2>
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>Detection Threshold:</span>
            <span className="text-cyan-300 font-bold">
              {settings.emergencyDetectionDistance} metres
            </span>
          </div>
          <input
            type="range"
            min="60"
            max="220"
            step="10"
            value={settings.emergencyDetectionDistance}
            onChange={(e) => engine.setEmergencyDetectionDistance(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer"
          />
          <p className="text-[11px] text-slate-500 mt-2 leading-tight">
            Earlier detection allows controller enough time to complete yellow & all-red clearance before the emergency vehicle arrives.
          </p>
        </div>
      </div>

      {/* Active Mission Telemetry Card */}
      {emergencyMission && emergencyMission.state !== 'CLEARED' ? (
        <div className="glass-panel p-6 rounded-2xl border border-rose-500/40 bg-gradient-to-r from-rose-950/20 via-[#0e172a] to-[#121e36]">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400">
                <Siren className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="text-base font-extrabold text-white flex items-center gap-2">
                  <span>ACTIVE MISSION: {emergencyMission.id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                    {emergencyMission.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Approach: <strong className="text-slate-200">{emergencyMission.approach}</strong> | Speed: <strong className="text-slate-200">{emergencyMission.speedKmh.toFixed(0)} km/h</strong>
                </div>
              </div>
            </div>

            {/* Live Distance & ETA */}
            <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 font-mono">
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Distance</div>
                <div className="text-sm font-bold text-cyan-300">
                  {Math.round(emergencyMission.distanceMetres)}m
                </div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">ETA to Stop</div>
                <div className="text-sm font-bold text-amber-300">
                  {emergencyMission.etaSeconds.toFixed(1)}s
                </div>
              </div>
              <div className="w-px h-8 bg-slate-700"></div>
              <div className="text-center">
                <div className="text-[10px] text-slate-400 uppercase">Delay Incurred</div>
                <div className="text-sm font-bold text-rose-400">
                  {emergencyMission.delayIncurredSeconds.toFixed(1)}s
                </div>
              </div>
            </div>
          </div>

          {/* Stepper Timeline */}
          <div>
            <div className="text-xs font-mono text-slate-400 mb-3">
              Preemption Lifecycle Sequence:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {steps.map((st, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div
                    key={st}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      isCurrent
                        ? 'bg-rose-500/20 border-rose-400 text-rose-200 font-bold shadow-md shadow-rose-500/20'
                        : isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#10182c] border-[#1d2a48] text-slate-500'
                    }`}
                  >
                    <div className="text-[9px] font-mono uppercase">{st.replace('_', ' ')}</div>
                    <div className="mt-1 flex justify-center">
                      {isPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block"></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-[#1f2f54] text-center text-slate-400 text-xs font-mono">
          Radar scanning: No active emergency responders in detection zone. Use the dispatch panel above to trigger an early-detected mission.
        </div>
      )}

      {/* Multi-Emergency Priority Arbitration Documentation */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
        <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          Multi-Emergency Vehicle Arbitration & Conflict Resolution Policy
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-[#0e1628] border border-[#1e2d4d]">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-rose-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Tier 1: Ambulance Priority
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Medical emergency vehicles carrying trauma/ICU patients possess absolute priority tier.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1628] border border-[#1e2d4d]">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-orange-300">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              Tier 2: Fire Tender Callout
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Industrial / structural fire tenders serviced after medical emergencies.
            </p>
          </div>
          <div className="p-3.5 rounded-xl bg-[#0e1628] border border-[#1e2d4d]">
            <div className="font-bold text-slate-100 flex items-center gap-1.5 text-blue-300">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Tier 3: Police Convoy
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              Rapid response police cruisers. Never granted simultaneous conflicting greens.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
