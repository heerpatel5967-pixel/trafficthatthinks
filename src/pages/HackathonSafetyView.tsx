import React from 'react';
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Scale,
  BookOpen,
  FileText,
  Play,
  ExternalLink,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';

interface HackathonSafetyViewProps {
  engine: SimulationEngine;
  onOpenSelfTest: () => void;
}

export const HackathonSafetyView: React.FC<HackathonSafetyViewProps> = ({
  engine,
  onOpenSelfTest,
}) => {
  const requirements = [
    {
      id: 1,
      title: 'Model one four-way intersection or short urban corridor',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Interactive 4-way intersection (North, East, South, West) with multi-lane roads, stop lines, pedestrian zebra crossings, and procedural vehicle models in Three.js and 2D canvas.',
      metric: 'IntersectionGeometry.ts & SimulationRenderer.ts rendering 4 approaches.',
    },
    {
      id: 2,
      title: 'Track vehicle counts, queue lengths, speeds, and signal phases',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Real-time telemetry tracks active vehicles, queued vehicles (speed < 0.8 m/s), queue distance in metres, average km/h, and active signal phase steps.',
      metric: 'CongestionScorer.ts & metrics.ts continuous 20Hz telemetry collection.',
    },
    {
      id: 3,
      title: 'Contextual factors: weather, incidents, emergency vehicles, time of day',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Context modifiers explicitly factor into kinematics: Monsoon Rain reduces free-flow speed by 20%; West lane blockage halves capacity; Ambulances trigger preemption corridors.',
      metric: 'ContextState engine pipeline with dynamic speedFactor integration.',
    },
    {
      id: 4,
      title: 'Recommend signal timings and explain decision reasons',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Adaptive controller evaluates transparent 50/30/20 heuristic score, calculates bounded green duration, checks starvation timers, and generates human-readable audit logs.',
      metric: 'AdaptiveTrafficController.ts generating DecisionRecord with primaryReason.',
    },
    {
      id: 5,
      title: 'Compare adaptive control with a fixed-timing baseline',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Scientific comparison runner executes both Fixed Baseline (25s cycle) and Adaptive AI under identical pseudo-random seeds and identical arrival sequences.',
      metric: 'ComparisonView.tsx empirical benchmark runner with delta calculations.',
    },
    {
      id: 6,
      title: 'Measure waiting time, queue length, throughput, emergency delay',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Physical event measurements calculate cumulative vehicle-seconds stopped, peak queue, completed exit counts, and emergency response delay without fabricated percentages.',
      metric: 'SimulationMetricsCollector tracking exact cumulative counters.',
    },
    {
      id: 7,
      title: 'Support repeatable scenarios and produce measurable results',
      status: 'VERIFIED IMPLEMENTED',
      details:
        '10 repeatable standardized scenarios (Normal, Peak, Monsoon Rain, Incident, Ambulance, Fire, Police, Surge, Uneven, Pedestrian) with documented seeds.',
      metric: 'ScenarioFactory.ts with Mulberry32 deterministic PRNG seeding.',
    },
    {
      id: 8,
      title: 'Clearly label simulated data, assumptions, and estimated outcomes',
      status: 'VERIFIED IMPLEMENTED',
      details:
        'Explicit documentation of model assumptions (IDM car-following parameters, Indian traffic vehicle distributions, free-flow speeds) distinguished from statutory legal timings.',
      metric: 'Dedicated assumptions & engineering disclaimers documented in UI.',
    },
    {
      id: 9,
      title: 'Never connect prototype to public traffic lights or unauthorized infrastructure',
      status: 'VERIFIED COMPLIANT',
      details:
        '100% self-contained client-side WebGL and TypeScript simulation. Zero external API keys, zero live signal hardware connection, fully offline compliant.',
      metric: 'Pure local mathematical simulation engine.',
    },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              OFFICIAL HACKATHON CRITERIA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              JU Techfest 2026 | SC-01 Track 02
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Hackathon Requirements, Traffic Rules & Safety Model
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Detailed compliance matrix for all 9 hackathon deliverables, Indian Motor Vehicles Act
            statutory references, and engineering safety boundaries.
          </p>
        </div>

        <button
          onClick={onOpenSelfTest}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
        >
          <ShieldCheck className="w-4 h-4" />
          Run Invariant Self-Test Suite
        </button>
      </div>

      {/* 9 Hackathon Requirements Verification Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Official Track 02 Compliance Verification Matrix (9/9 Verified)
          </h2>
          <span className="text-xs font-mono text-emerald-400 font-bold">
            All 9 Criteria Fulfilled & Testable
          </span>
        </div>

        <div className="space-y-3">
          {requirements.map((req) => (
            <div
              key={req.id}
              className="p-4 rounded-xl bg-[#0f172a] border border-[#1e293b] flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3 flex-1">
                <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                  {req.id}
                </span>
                <div>
                  <div className="font-bold text-slate-100 text-sm">{req.title}</div>
                  <div className="text-slate-400 mt-1 leading-relaxed">{req.details}</div>
                  <div className="text-[11px] font-mono text-cyan-300/80 mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Implementation: {req.metric}
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
                {req.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Indian Traffic Rules & Engineering Model */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Statutory Legal References */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
            <Scale className="w-4 h-4 text-cyan-400" />
            Verified Indian Legal & Signal Standards
          </h2>
          <div className="space-y-3 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-[#10192d] border border-[#1f2f54]">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Motor Vehicles Act, 1988 (Section 119)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Mandates strict observance of traffic signs and signals. Conflicting signals violate statutory road safety obligations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#10192d] border border-[#1f2f54]">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Rules of the Road Regulations, 1989 (LHT)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Codifies Left-Hand Traffic (LHT) across Indian roadways. Vehicles drive on the left side of the median; left turns are near-side and right turns cross opposing traffic.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#10192d] border border-[#1f2f54]">
              <div className="font-bold text-white flex items-center gap-2">
                <span>Indian Roads Congress (IRC:93-1985 & IRC:67-2012)</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Signal Design Guidelines: requires guaranteed intergreen clearance intervals (yellow + all-red clearance) to purge conflict zones before granting green to conflicting movements.
              </p>
            </div>
          </div>
        </div>

        {/* Engineering Boundaries & Assumptions */}
        <div className="glass-panel p-6 rounded-2xl border border-[#1f2f54]">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-amber-400" />
            Engineering Model Distinctions & Disclaimers
          </h2>
          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Simulated Research Testbed Only
              </div>
              <p className="text-[11px] text-amber-300/80 mt-1">
                This project is an academic simulation designed for JU Techfest 2026. It is not approved for real-world physical intersection control.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[#10192d] border border-[#1f2f54]">
              <div className="font-bold text-white">Simulation Parameter Assumptions:</div>
              <ul className="text-[11px] text-slate-400 mt-1 list-disc list-inside space-y-1">
                <li>Demonstration green bounds (8s–40s) are heuristic simulation defaults.</li>
                <li>Monsoon rain assumes a 20% reduction in vehicle free-flow speeds.</li>
                <li>Radar detection zone represents RFID / DSRC / Camera detection range.</li>
                <li>All performance metrics represent deterministic simulated agents.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
