import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, AlertTriangle, Info, Clock } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

const SeverityIcon = ({ severity }) => {
  switch (severity) {
    case 'P0': return <AlertCircle className="w-5 h-5 text-rose-500" />;
    case 'P1': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'P2': return <Info className="w-5 h-5 text-blue-400" />;
    default: return null;
  }
};

const StateBadge = ({ state }) => {
  const styles = {
    OPEN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    INVESTIGATING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    RESOLVED: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[state]}`}>
      {state}
    </span>
  );
};

export default function Dashboard({ onSelectIncident }) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    const interval = setInterval(fetchIncidents, 5000); // Polling for real-time feel
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-center py-12 text-slate-400 animate-pulse">Loading active incidents...</div>;
  if (error) return <div className="text-center py-12 text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20">{error}</div>;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Active Incidents</h2>
        <div className="text-sm text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Live updating
        </div>
      </div>

      <div className="grid gap-4">
        {incidents.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/50 rounded-xl border border-white/5 text-slate-400">
            No active incidents. System is healthy.
          </div>
        ) : (
          incidents.map((inc) => (
            <div 
              key={inc.id}
              onClick={() => onSelectIncident(inc.id)}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 rounded-xl cursor-pointer transition-all duration-200"
            >
              <div className="flex items-start sm:items-center gap-4">
                <div className="mt-1 sm:mt-0 bg-slate-950 p-2 rounded-lg border border-white/5 group-hover:scale-110 transition-transform">
                  <SeverityIcon severity={inc.severity} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-medium text-white group-hover:text-indigo-400 transition-colors">
                      {inc.component_id}
                    </h3>
                    <StateBadge state={inc.state} />
                  </div>
                  <div className="text-sm text-slate-400 flex items-center gap-2">
                    <span>ID: #{inc.id}</span>
                    <span>&bull;</span>
                    <span>Started {formatDistanceToNow(inc.start_time * 1000)} ago</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors flex items-center">
                View Details <span className="ml-1 group-hover:translate-x-1 transition-transform">&rarr;</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
