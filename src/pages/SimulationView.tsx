import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  Layers,
  CloudRain,
  Eye,
  Siren,
  Plus,
  Compass,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { SimulationRenderer, CameraPreset } from '../three/SimulationRenderer';
import { Fallback2DView } from '../components/Fallback2DView';
import { Approach, VehicleType } from '../types/traffic';
import { ConflictMatrix } from '../simulation/conflictMatrix';

interface SimulationViewProps {
  engine: SimulationEngine;
}

export const SimulationView: React.FC<SimulationViewProps> = ({ engine }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<SimulationRenderer | null>(null);
  const [viewMode, setViewMode] = useState<'3d' | '2d'>('3d');
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('isometric');
  const [webGlError, setWebGlError] = useState<string | null>(null);

  const signalState = engine.getSignalState();
  const activeApproach = ConflictMatrix.PHASE_TO_APPROACH[signalState.currentPhase];
  const emergencyMission = engine.getActiveEmergencyMission();
  const context = engine.getContext();
  const vehicles = engine.getVehicles();

  // Vehicle type breakdown
  const vehicleCounts = vehicles.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  useEffect(() => {
    if (viewMode !== '3d' || !containerRef.current) return;

    try {
      const renderer = new SimulationRenderer(containerRef.current, engine);
      rendererRef.current = renderer;
      renderer.setCameraPreset(cameraPreset);

      return () => {
        renderer.dispose();
        rendererRef.current = null;
      };
    } catch (err: any) {
      console.error('WebGL initialization error:', err);
      setWebGlError(err.message || 'WebGL not supported on this browser/GPU');
      setViewMode('2d');
    }
  }, [viewMode, engine]);

  const handleCameraChange = (preset: CameraPreset) => {
    setCameraPreset(preset);
    if (rendererRef.current) {
      rendererRef.current.setCameraPreset(preset);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-[#070b14]">
      {/* Top Floating Viewport Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Signal Phase Live Telemetry HUD */}
        <div className="glass-panel px-4 py-2 rounded-xl border border-[#1f2f54] pointer-events-auto flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                signalState.step === 'GREEN'
                  ? 'bg-emerald-400 animate-pulse'
                  : signalState.step === 'YELLOW'
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-rose-500'
              }`}
            ></span>
            <span className="font-bold text-xs font-mono text-slate-100">
              {signalState.step === 'ALL_RED'
                ? 'ALL-RED CLEARANCE'
                : `${activeApproach.toUpperCase()} APPROACH: ${signalState.step}`}
            </span>
          </div>
          <div className="font-mono text-xs text-cyan-300 border-l border-slate-700 pl-3">
            {signalState.elapsedInStep.toFixed(1)}s / {signalState.targetStepDuration.toFixed(1)}s
          </div>
        </div>

        {/* Center: Emergency Banner if active */}
        {emergencyMission && emergencyMission.state !== 'CLEARED' && (
          <div className="glass-panel px-4 py-2 rounded-xl bg-rose-950/80 border border-rose-500/60 pointer-events-auto flex items-center gap-2.5 text-xs font-mono text-rose-200 shadow-xl shadow-rose-950/40 animate-pulse">
            <Siren className="w-4 h-4 text-rose-400 animate-bounce" />
            <span className="font-bold">{emergencyMission.type.toUpperCase()} PREEMPTION</span>
            <span className="text-slate-300">
              {emergencyMission.approach} Corridor | ETA: {emergencyMission.etaSeconds.toFixed(1)}s
            </span>
          </div>
        )}

        {/* Right: Camera Presets & 2D/3D Mode Selector */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 3D / 2D Toggle */}
          <div className="glass-panel p-1 rounded-xl border border-[#1f2f54] flex items-center text-xs font-mono">
            <button
              onClick={() => setViewMode('3d')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === '3d'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              3D WebGL
            </button>
            <button
              onClick={() => setViewMode('2d')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === '2d'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              2D Radar
            </button>
          </div>

          {/* Camera Angles (in 3D mode) */}
          {viewMode === '3d' && (
            <div className="glass-panel p-1 rounded-xl border border-[#1f2f54] hidden sm:flex items-center text-xs font-mono">
              {(
                [
                  { id: 'isometric', label: 'Isometric' },
                  { id: 'topdown', label: 'Top-Down' },
                  { id: 'approach', label: 'Curb POV' },
                  { id: 'chase', label: 'Chase Cam' },
                ] as const
              ).map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleCameraChange(preset.id)}
                  className={`px-2.5 py-1.5 rounded-lg transition-colors ${
                    cameraPreset === preset.id
                      ? 'bg-slate-700 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 w-full h-full relative">
        {viewMode === '3d' ? (
          <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        ) : (
          <Fallback2DView engine={engine} />
        )}

        {webGlError && (
          <div className="absolute top-20 left-4 right-4 z-30 p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-200 text-xs font-mono">
            Notice: WebGL unavailable ({webGlError}). Displaying high-performance 2D Canvas Radar fallback.
          </div>
        )}
      </div>

      {/* Bottom Floating Telemetry Overlay */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Vehicle distribution pills */}
        <div className="glass-panel px-4 py-2 rounded-xl border border-[#1f2f54] pointer-events-auto flex items-center gap-3 text-xs font-mono text-slate-300 shadow-xl">
          <span className="text-cyan-400 font-bold">{vehicles.length} Vehicles:</span>
          <span>Cars: {vehicleCounts.car || 0}</span>
          <span>Buses: {vehicleCounts.bus || 0}</span>
          <span>Autos: {vehicleCounts.auto_rickshaw || 0}</span>
          <span>Bikes: {vehicleCounts.two_wheeler || 0}</span>
          <span>Trucks: {vehicleCounts.truck || 0}</span>
          {(vehicleCounts.ambulance || 0) + (vehicleCounts.fire_engine || 0) + (vehicleCounts.police || 0) > 0 && (
            <span className="text-rose-400 font-bold animate-pulse">
              Emergency: {(vehicleCounts.ambulance || 0) + (vehicleCounts.fire_engine || 0) + (vehicleCounts.police || 0)}
            </span>
          )}
        </div>

        {/* Quick Weather / Incident buttons */}
        <div className="glass-panel px-3 py-1.5 rounded-xl border border-[#1f2f54] pointer-events-auto flex items-center gap-2 text-xs font-mono shadow-xl">
          <span className="text-slate-400 flex items-center gap-1">
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            Weather:
          </span>
          <button
            onClick={() => engine.setWeather('clear')}
            className={`px-2 py-0.5 rounded ${context.weather === 'clear' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
          >
            Clear
          </button>
          <button
            onClick={() => engine.setWeather('rain')}
            className={`px-2 py-0.5 rounded ${context.weather === 'rain' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400'}`}
          >
            Monsoon
          </button>
        </div>
      </div>
    </div>
  );
};
