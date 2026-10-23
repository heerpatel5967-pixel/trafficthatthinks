import React from 'react';
import {
  LayoutDashboard,
  Box,
  TrafficCone,
  Siren,
  LineChart,
  GitCompare,
  FlaskConical,
  ScrollText,
  Sliders,
  Award,
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'simulation'
  | 'controller'
  | 'emergency'
  | 'analytics'
  | 'comparison'
  | 'scenarios'
  | 'decisions'
  | 'settings'
  | 'hackathon';

interface SidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const menuItems: Array<{ id: NavTabId; label: string; icon: React.ReactNode; badge?: string }> = [
    { id: 'overview', label: '1. Overview Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'simulation', label: '2. Live 3D Simulation', icon: <Box className="w-4 h-4" />, badge: '3D/2D' },
    { id: 'controller', label: '3. Signal Controller', icon: <TrafficCone className="w-4 h-4" /> },
    { id: 'emergency', label: '4. Emergency Command', icon: <Siren className="w-4 h-4" />, badge: 'Priority' },
    { id: 'analytics', label: '5. Congestion Analytics', icon: <LineChart className="w-4 h-4" /> },
    { id: 'comparison', label: '6. Fixed vs Adaptive', icon: <GitCompare className="w-4 h-4" />, badge: 'Benchmark' },
    { id: 'scenarios', label: '7. Scenario Laboratory', icon: <FlaskConical className="w-4 h-4" /> },
    { id: 'decisions', label: '8. Decision & Event Log', icon: <ScrollText className="w-4 h-4" /> },
    { id: 'settings', label: '9. System Settings', icon: <Sliders className="w-4 h-4" /> },
    { id: 'hackathon', label: '10. Requirements & Safety', icon: <Award className="w-4 h-4" />, badge: 'JU 2026' },
  ];

  return (
    <aside className="w-64 border-r border-[#1f2f54] bg-[#090f1d] flex flex-col justify-between select-none">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
          Navigation Modules
        </div>

        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/15 to-blue-500/5 text-cyan-300 border border-cyan-500/30 shadow-md shadow-cyan-500/5 font-semibold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#111c33]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-cyan-400' : 'text-slate-500'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Status Footnote */}
      <div className="p-4 border-t border-[#1f2f54] bg-[#070b15]">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Engine Active
          </span>
          <span className="text-slate-500">v1.0.0</span>
        </div>
        <div className="mt-2 text-[10px] text-slate-500 leading-tight">
          Deterministic local controller. Zero physical signal connection.
        </div>
      </div>
    </aside>
  );
};
