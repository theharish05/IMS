import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import IncidentDetail from './components/IncidentDetail';
import { ShieldAlert } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState(null);

  const navigateTo = (view, id = null) => {
    setCurrentView(view);
    setSelectedIncidentId(id);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-indigo-500/30">
      <header className="border-b border-white/10 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center cursor-pointer group" onClick={() => navigateTo('dashboard')}>
              <div className="p-2 bg-rose-500/10 rounded-lg group-hover:bg-rose-500/20 transition-colors mr-3">
                <ShieldAlert className="h-6 w-6 text-rose-500" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Incident Management System
              </h1>
            </div>
            {currentView !== 'dashboard' && (
              <button 
                onClick={() => navigateTo('dashboard')}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                &larr; Back to Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' && <Dashboard onSelectIncident={(id) => navigateTo('detail', id)} />}
        {currentView === 'detail' && <IncidentDetail incidentId={selectedIncidentId} />}
      </main>
    </div>
  );
}

export default App;
