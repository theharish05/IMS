import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertTriangle, Clock, Activity, ShieldCheck, Box, Server, Database } from 'lucide-react';

const API_BASE = '/api/v1';

const SeverityBadge = ({ severity }) => {
  const configs = {
    'P0': { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    'P1': { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    'P2': { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  };
  const config = configs[severity] || configs['P2'];
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${config.bg} ${config.border} ${config.color}`}>
      {severity}
    </span>
  );
};

const StateBadge = ({ state }) => {
  const styles = {
    OPEN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    INVESTIGATING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CLOSED: 'bg-zinc-800 text-zinc-400 border-zinc-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${styles[state]}`}>
      {state}
    </span>
  );
};

const getComponentIcon = (componentId) => {
  const id = componentId.toLowerCase();
  if (id.includes('database') || id.includes('db')) return <Database className="w-5 h-5 text-zinc-400" />;
  if (id.includes('server') || id.includes('node')) return <Server className="w-5 h-5 text-zinc-400" />;
  return <Box className="w-5 h-5 text-zinc-400" />;
};

export default function Dashboard({ onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const res = await fetch(`${API_BASE}/incidents`);
        if (!res.ok) throw new Error('Failed to fetch incidents');
        const data = await res.json();
        setIncidents(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
    const interval = setInterval(fetchIncidents, 3000); 
    return () => clearInterval(interval);
  }, []);

  const openCount = incidents.filter(i => i.state === 'OPEN').length;
  const closedCount = incidents.filter(i => i.state === 'CLOSED').length;

  const filteredIncidents = incidents.filter(inc => 
    activeTab === 'active' ? ['OPEN', 'INVESTIGATING', 'RESOLVED'].includes(inc.state) : inc.state === 'CLOSED'
  );

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-indigo-400">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">Loading Telemetry...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-zinc-500" />
            <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Total Active</div>
          </div>
          <div className="text-4xl font-bold tracking-tighter text-white drop-shadow-md">{incidents.length}</div>
        </div>
        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-rose-500/50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <div className="text-xs font-semibold text-rose-500/80 uppercase tracking-wider">Critical Open</div>
          </div>
          <div className="text-4xl font-bold tracking-tighter text-rose-400 drop-shadow-md">{openCount}</div>
        </div>
        <div className="glass-panel p-5 rounded-xl border-t-2 border-t-emerald-500/50">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <div className="text-xs font-semibold text-emerald-500/80 uppercase tracking-wider">Total Closed</div>
          </div>
          <div className="text-4xl font-bold tracking-tighter text-emerald-400 drop-shadow-md">{closedCount}</div>
        </div>
      </div>

      {/* Main Board */}
      <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
        {/* Header Tabs */}
        <div className="border-b border-white/5 bg-[#18181b]/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-[#09090b] p-1 rounded-lg border border-white/5">
              <button 
                onClick={() => setActiveTab('active')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'active' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Active Alerts
              </button>
              <button 
                onClick={() => setActiveTab('closed')}
                className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${activeTab === 'closed' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Closed Tickets
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Live</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="p-3">
          {error && <div className="m-2 p-3 text-rose-400 bg-rose-500/10 rounded-lg border border-rose-500/20 text-xs">{error}</div>}
          
          {filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <ShieldCheck className="w-12 h-12 text-zinc-700 mb-3" />
              <p className="text-sm font-medium text-zinc-300">
                {activeTab === 'active' ? 'Zero Active Incidents' : 'No Closed Incidents'}
              </p>
              <p className="text-xs text-zinc-600 mt-1">
                {activeTab === 'active' ? 'All monitored systems are operating normally.' : 'Closed tickets will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredIncidents.map((inc) => (
                <div 
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="glass-card group flex items-center justify-between p-4 rounded-lg cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center border border-white/5 group-hover:bg-zinc-800 transition-colors">
                      {getComponentIcon(inc.component_id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <SeverityBadge severity={inc.severity} />
                        <h3 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">
                          {inc.component_id}
                        </h3>
                      </div>
                      <div className="text-xs text-zinc-500 font-mono flex items-center gap-2">
                        <span>#{inc.id.toString().padStart(4, '0')}</span>
                        <span className="text-zinc-700">&bull;</span>
                        <span>{formatDistanceToNow(inc.start_time * 1000)} ago</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <StateBadge state={inc.state} />
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 text-xs hidden sm:block">
                      View details &rarr;
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
