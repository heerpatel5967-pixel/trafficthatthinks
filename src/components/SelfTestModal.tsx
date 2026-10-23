import React, { useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Play, X, ShieldCheck } from 'lucide-react';
import { SimulationEngine } from '../simulation/engine';

interface SelfTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: SimulationEngine;
}

export const SelfTestModal: React.FC<SelfTestModalProps> = ({ isOpen, onClose, engine }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<
    Array<{ id: number; name: string; passed: boolean; message: string }>
  >([]);
  const [hasRun, setHasRun] = useState(false);

  if (!isOpen) return null;

  const handleRunTests = () => {
    setIsRunning(true);
    // Simulate test execution delay for visual clarity
    setTimeout(() => {
      const testResults = engine.runSelfTest();
      setResults(testResults);
      setHasRun(true);
      setIsRunning(false);
    }, 450);
  };

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;
  const allPassed = hasRun && passedCount === totalCount && totalCount > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0c1424] border border-[#1f2f54] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f2f54] flex items-center justify-between bg-[#0e172a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Automated Simulation Invariants & Safety Test Suite
              </h2>
              <p className="text-xs text-slate-400">
                JU Techfest 2026 | SC-01 Track 02 Invariant Verification Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Tests list */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 rounded-xl bg-[#131e36] border border-[#1f2f54] flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">
                20 Deterministic Simulation Checks
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Verifies signal mutual exclusion, clearance intervals, emergency preemption, queue kinematics, and seed reproducibility.
              </div>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {isRunning ? 'Running Checks...' : 'Execute Self-Test Suite'}
            </button>
          </div>

          {hasRun && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                allPassed
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-3">
                {allPassed ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-sm">
                    {allPassed ? 'ALL SAFETY INVARIANTS VERIFIED (PASS)' : 'SAFETY CHECK ANOMALIES DETECTED'}
                  </div>
                  <div className="text-xs opacity-80 mt-0.5">
                    {passedCount} of {totalCount} automated tests passed successfully.
                  </div>
                </div>
              </div>
              <span className="font-mono text-sm px-3 py-1 rounded bg-black/40 border border-white/10 font-bold">
                {passedCount}/{totalCount}
              </span>
            </div>
          )}

          {/* Test items */}
          <div className="space-y-2">
            {results.map((test) => (
              <div
                key={test.id}
                className={`p-3 rounded-lg border text-xs flex items-start gap-3 transition-colors ${
                  test.passed
                    ? 'bg-[#0f182c] border-[#1e2d4d] text-slate-300'
                    : 'bg-rose-950/20 border-rose-700/50 text-rose-200'
                }`}
              >
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold text-slate-100 flex items-center gap-2">
                    <span className="text-cyan-400 font-mono">#{test.id.toString().padStart(2, '0')}</span>
                    {test.name}
                  </div>
                  <div className="text-slate-400 mt-1 font-mono text-[11px] leading-relaxed">
                    {test.message}
                  </div>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                    test.passed
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {test.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#1f2f54] bg-[#090f1d] flex items-center justify-between text-xs text-slate-400">
          <div>Deterministic execution running against active simulation instance.</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
