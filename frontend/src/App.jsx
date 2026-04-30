import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import IncidentDetail from './components/IncidentDetail';
import { Shield, Sparkles } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  const navigateTo = (view, id = null) => {
    setCurrentView(view);
    setSelectedIncidentId(id);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#09090b] text-[#fafafa] font-sans">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px] pointer-events-none -z-10" />
      
      <header className="border-b border-white/5 bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer group" onClick={() => navigateTo('dashboard')}>
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 mr-3 shadow-[0_0_15px_rgba(99,102,241,0.4)]">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  IMS
                </h1>
              </div>
            </div>
            {currentView !== 'dashboard' && (
              <button 
                onClick={() => navigateTo('dashboard')}
                className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-md border border-white/5 transition-all flex items-center gap-2"
              >
                <span>&larr;</span> Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 relative z-10">
        {currentView === 'dashboard' && <Dashboard onSelectIncident={(id) => navigateTo('detail', id)} />}
        {currentView === 'detail' && <IncidentDetail incidentId={selectedIncidentId} />}
      </main>
    </div>
  );
}

export default App;
