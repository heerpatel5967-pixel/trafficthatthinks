import React, { useEffect, useRef, useState } from 'react';
import { SimulationEngine } from './simulation/engine';
import { Navbar } from './components/Navbar';
import { NavTabId, Sidebar } from './components/Sidebar';
import { SelfTestModal } from './components/SelfTestModal';

// Pages
import { OverviewDashboard } from './pages/OverviewDashboard';
import { SimulationView } from './pages/SimulationView';
import { SignalControllerView } from './pages/SignalControllerView';
import { EmergencyCommandView } from './pages/EmergencyCommandView';
import { AnalyticsView } from './pages/AnalyticsView';
import { ComparisonView } from './pages/ComparisonView';
import { ScenarioLabView } from './pages/ScenarioLabView';
import { DecisionLogView } from './pages/DecisionLogView';
import { SettingsView } from './pages/SettingsView';
import { HackathonSafetyView } from './pages/HackathonSafetyView';

export const App: React.FC = () => {
  const engineRef = useRef<SimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new SimulationEngine('normal-traffic', 101);
  }
  const engine = engineRef.current;

  const [currentTab, setCurrentTab] = useState<NavTabId>('overview');
  const [isSelfTestOpen, setIsSelfTestOpen] = useState(false);
  const [, setTickCounter] = useState(0);

  useEffect(() => {
    // Start simulation automatically in background
    engine.start();

    // Subscribe to simulation state changes
    const unsubscribe = engine.subscribe(() => {
      setTickCounter((prev) => prev + 1);
    });

    return () => {
      engine.pause();
      unsubscribe();
    };
  }, [engine]);

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'overview':
        return (
          <OverviewDashboard
            engine={engine}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSelfTest={() => setIsSelfTestOpen(true)}
          />
        );
      case 'simulation':
        return <SimulationView engine={engine} />;
      case 'controller':
        return <SignalControllerView engine={engine} />;
      case 'emergency':
        return <EmergencyCommandView engine={engine} />;
      case 'analytics':
        return <AnalyticsView engine={engine} />;
      case 'comparison':
        return <ComparisonView engine={engine} />;
      case 'scenarios':
        return (
          <ScenarioLabView
            engine={engine}
            onNavigateToSim={() => setCurrentTab('simulation')}
          />
        );
      case 'decisions':
        return <DecisionLogView engine={engine} />;
      case 'settings':
        return <SettingsView engine={engine} />;
      case 'hackathon':
        return (
          <HackathonSafetyView
            engine={engine}
            onOpenSelfTest={() => setIsSelfTestOpen(true)}
          />
        );
      default:
        return (
          <OverviewDashboard
            engine={engine}
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenSelfTest={() => setIsSelfTestOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Navbar */}
      <Navbar
        engine={engine}
        onOpenSelfTest={() => setIsSelfTestOpen(true)}
        onToggleSettings={() => setCurrentTab('settings')}
        currentTab={currentTab}
      />

      {/* Main Layout Area: Sidebar + Active Page */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />
        <main className="flex-1 overflow-hidden relative bg-[#070b14]">
          {renderActiveTab()}
        </main>
      </div>

      {/* 20-Invariant Automated Self-Test Modal */}
      <SelfTestModal
        isOpen={isSelfTestOpen}
        onClose={() => setIsSelfTestOpen(false)}
        engine={engine}
      />
    </div>
  );
};

export default App;
