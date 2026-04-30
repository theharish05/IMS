import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import IncidentDetail from './components/IncidentDetail';

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
          <div className="flex items-center h-16 relative">
            <div className="z-10 flex-shrink-0">
              {currentView !== 'dashboard' && (
                <button 
                  onClick={() => navigateTo('dashboard')}
                  className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900/50 hover:bg-zinc-800 px-3 py-1.5 rounded-md border border-white/5 transition-all flex items-center gap-2"
                >
                  <span>&larr;</span> Back to Dashboard
                </button>
              )}
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center cursor-pointer group pointer-events-auto" onClick={() => navigateTo('dashboard')}>
                <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-indigo-400 transition-colors">
                  Incident Management System
                </h1>
              </div>
            </div>
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

