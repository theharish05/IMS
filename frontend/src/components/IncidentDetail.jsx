import React, { useState, useEffect } from 'react';
import RCAForm from './RCAForm';
import { format } from 'date-fns';
import { Activity, Database, CheckCircle, ShieldAlert, Cpu, Network, Zap, Clock } from 'lucide-react';

const API_BASE = '/api/v1';

export default function IncidentDetail({ incidentId }) {
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIncident = async () => {
    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}`);
      if (!res.ok) throw new Error('Failed to fetch incident details');
      const data = await res.json();
      setIncident(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-indigo-400">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
    </div>
  );
  
  if (error) return <div className="text-center py-8 text-rose-400 bg-rose-500/10 rounded-xl border border-rose-500/20 glass-panel">{error}</div>;
  if (!incident) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Panel */}
      <div className="glass-panel rounded-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-t-4 border-t-indigo-500">
        <div>
          <div className="text-xs font-mono text-zinc-500 mb-2 flex items-center gap-2">
            <span>INCIDENT #{incident.id.toString().padStart(4, '0')}</span>
            <span className="px-2 py-0.5 bg-zinc-800 rounded text-zinc-300 border border-zinc-700">{incident.state}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            {incident.severity === 'P0' ? <ShieldAlert className="w-6 h-6 text-rose-500" /> : <Activity className="w-6 h-6 text-amber-500" />}
            {incident.component_id}
          </h2>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <div className="glass-card flex-1 md:flex-none p-3 rounded-lg text-center min-w-[100px]">
            <div className="text-[10px] text-zinc-500 uppercase font-semibold mb-1">Time to Repair</div>
            <div className="text-sm font-bold text-white font-mono">
              {incident.end_time 
                ? (() => {
                    const diffSec = Math.round(incident.end_time - incident.start_time);
                    const m = Math.floor(diffSec / 60);
                    const s = diffSec % 60;
                    if (m === 0) return `${s}s`;
                    return `${m}m ${s}s`;
                  })()
                : <span className="text-rose-400">Active</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Left Col: RCA */}
        <div className="lg:col-span-2 space-y-6 lg:order-last">
          <div className="glass-panel rounded-xl h-full flex flex-col">
            <div className="p-4 border-b border-white/5 bg-[#18181b]/50">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Resolution & RCA
              </h3>
            </div>
            
            <div className="p-5 flex-1">
              {incident.rca ? (
                <div className="space-y-5 animate-in fade-in">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <h4 className="font-semibold text-emerald-400 text-sm">Resolved</h4>
                      <p className="text-xs text-emerald-400/80">RCA successfully documented.</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-2">
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Root Cause Category</div>
                      <div className="text-sm text-zinc-200 bg-zinc-900/50 p-2.5 rounded border border-white/5">
                        {incident.rca.root_cause_category}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Fix Applied</div>
                      <div className="text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded border border-white/5 whitespace-pre-wrap">
                        {incident.rca.fix_applied}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Prevention Steps</div>
                      <div className="text-sm text-zinc-300 bg-zinc-900/50 p-3 rounded border border-white/5 whitespace-pre-wrap">
                        {incident.rca.prevention_steps}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <RCAForm incidentId={incident.id} onComplete={fetchIncident} />
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Telemetry */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-panel rounded-xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-white/5 bg-[#18181b]/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Network className="w-4 h-4 text-indigo-400" />
                Raw Telemetry Logs
              </h3>
              <span className="text-xs text-zinc-500 font-mono bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                {incident.signals?.length || 0} events
              </span>
            </div>
            
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-[#09090b]/50">
              {incident.signals?.map((sig, idx) => (
                <div key={idx} className="bg-[#18181b] border border-white/5 rounded-lg p-3 hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] text-zinc-500">
                      {format(new Date(sig.timestamp * 1000), 'yyyy-MM-dd HH:mm:ss.SSS')}
                    </span>
                    <span className="text-[10px] text-rose-400 font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded">ERROR</span>
                  </div>
                  <pre className="text-xs font-mono text-zinc-300 whitespace-pre-wrap break-words">
                    {JSON.stringify(sig.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
