import React, { useState } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  Download,
  FileJson,
  Trash2,
  CheckCircle2,
  Siren,
  Zap,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';
import { DecisionRecord } from '../types/traffic';

interface DecisionLogViewProps {
  engine: SimulationEngine;
}

export const DecisionLogView: React.FC<DecisionLogViewProps> = ({ engine }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [clearedNotice, setClearedNotice] = useState(false);

  const decisions = engine.getDecisions();

  const filteredDecisions = decisions.filter((d) => {
    const matchesType = typeFilter === 'ALL' || d.actionType === typeFilter;
    const matchesSearch =
      d.selectedApproach.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.primaryReason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.actionType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleExportCSV = () => {
    if (decisions.length === 0) return;
    const header = 'ID,SimTime(s),ActionType,SelectedApproach,AllocatedGreen(s),Reason,SafetyCheck,NorthScore,EastScore,SouthScore,WestScore\n';
    const rows = decisions
      .map(
        (d) =>
          `"${d.id}",${d.simTime},"${d.actionType}","${d.selectedApproach}",${d.allocatedGreenDuration},"${d.primaryReason.replace(
            /"/g,
            '""'
          )}","${d.safetyCheckResult}",${d.approachScores.North},${d.approachScores.East},${d.approachScores.South},${d.approachScores.West}`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-decision-log-t${Math.floor(engine.getSimTime())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (decisions.length === 0) return;
    const blob = new Blob([JSON.stringify(decisions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `traffic-decision-log-t${Math.floor(engine.getSimTime())}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearLog = () => {
    if (window.confirm('Are you sure you want to clear the real-time decision log?')) {
      engine.reset();
      setClearedNotice(true);
      setTimeout(() => setClearedNotice(false), 2500);
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              AUDITABLE REASONING SYSTEM
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              Explainable AI (XAI)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            Real-Time Decision & Event Explanation Log
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Every phase adjustment, emergency preemption, and starvation override is accompanied by
            transparent rationale and input metric values.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={decisions.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#111c33] hover:bg-[#1a2847] text-slate-200 border border-[#1f2f54] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            Export CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={decisions.length === 0}
            className="px-3.5 py-2 rounded-xl bg-[#111c33] hover:bg-[#1a2847] text-slate-200 border border-[#1f2f54] text-xs font-semibold flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <FileJson className="w-4 h-4 text-blue-400" />
            Export JSON
          </button>
          <button
            onClick={handleClearLog}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
            title="Clear Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {clearedNotice && (
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
          Decision log refreshed.
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-[#1f2f54] flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search reasons or approaches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111c33] border border-[#1f2f54] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#111c33] border border-[#1f2f54] rounded-xl px-3 py-1.5 text-xs text-slate-300 font-mono outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Decision Types</option>
            <option value="PHASE_SWITCH">Phase Switch</option>
            <option value="EMERGENCY_PREEMPTION">Emergency Preemption</option>
            <option value="STARVATION_OVERRIDE">Starvation Override</option>
            <option value="EXTENSION">Green Extension</option>
          </select>
          <span className="text-xs text-slate-500 font-mono">
            {filteredDecisions.length} / {decisions.length} records
          </span>
        </div>
      </div>

      {/* Decision Records List */}
      <div className="space-y-3">
        {filteredDecisions.length === 0 ? (
          <div className="p-12 rounded-2xl border border-dashed border-[#1f2f54] text-center text-slate-500 text-xs font-mono">
            No decisions logged matching the current criteria. Ensure the simulation is running with Adaptive mode active.
          </div>
        ) : (
          filteredDecisions.map((record) => {
            const isEmerg = record.actionType === 'EMERGENCY_PREEMPTION';
            const isStarve = record.actionType === 'STARVATION_OVERRIDE';

            return (
              <div
                key={record.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isEmerg
                    ? 'bg-gradient-to-r from-rose-950/30 to-[#0e1628] border-rose-500/40 shadow-sm shadow-rose-950/20'
                    : isStarve
                    ? 'bg-gradient-to-r from-amber-950/30 to-[#0e1628] border-amber-500/40'
                    : 'bg-[#0f182c] border-[#1e2d4d]'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      T+{record.simTime.toFixed(1)}s
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        isEmerg
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : isStarve
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {record.actionType.replace('_', ' ')}
                    </span>

                    <span className="font-extrabold text-sm text-white">
                      Approach: {record.selectedApproach}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">
                      Allocated: <strong className="text-cyan-300">{record.allocatedGreenDuration}s Green</strong>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      {record.safetyCheckResult}
                    </span>
                  </div>
                </div>

                {/* Explanation text */}
                <div className="text-xs text-slate-300 mt-2.5 font-sans leading-relaxed">
                  {record.primaryReason}
                </div>

                {/* Scores breakdown badge line */}
                <div className="mt-3 pt-2 border-t border-slate-700/40 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                  <div className="flex items-center gap-3">
                    <span>Compete Scores:</span>
                    <span>North: <strong className="text-slate-200">{record.approachScores.North?.toFixed(1) || '0.0'}</strong></span>
                    <span>East: <strong className="text-slate-200">{record.approachScores.East?.toFixed(1) || '0.0'}</strong></span>
                    <span>South: <strong className="text-slate-200">{record.approachScores.South?.toFixed(1) || '0.0'}</strong></span>
                    <span>West: <strong className="text-slate-200">{record.approachScores.West?.toFixed(1) || '0.0'}</strong></span>
                  </div>
                  <div>
                    Queue at Decision: <strong className="text-slate-300">{record.metricsBefore.totalQueue} veh</strong>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
