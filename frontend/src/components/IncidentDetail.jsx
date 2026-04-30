import React, { useState, useEffect } from 'react';
import RCAForm from './RCAForm';
import { format } from 'date-fns';
import { Activity, Database, CheckCircle, ShieldAlert } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/v1';

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

  if (loading) return <div className="text-center py-12 text-slate-400 animate-pulse">Loading incident details...</div>;
  if (error) return <div className="text-center py-12 text-rose-400">{error}</div>;
  if (!incident) return null;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-slate-900/40 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-white/5 bg-slate-800/30">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <ShieldAlert className="text-rose-500 w-6 h-6" />
                <h2 className="text-2xl font-bold text-white tracking-tight">{incident.component_id}</h2>
              </div>
              <div className="text-slate-400 flex gap-4 text-sm">
                <span>Incident #{incident.id}</span>
                <span>Severity: <span className="font-medium text-amber-400">{incident.severity}</span></span>
                <span>State: <span className="font-medium text-indigo-400">{incident.state}</span></span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-400 mb-1">Duration / MTTR</div>
              <div className="font-mono text-lg text-white">
                {incident.end_time 
                  ? `${Math.round((incident.end_time - incident.start_time) / 60)} mins`
                  : 'Ongoing'}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <div className="p-6">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Raw Signals ({incident.signals?.length || 0})
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {incident.signals?.map((sig, idx) => (
                <div key={idx} className="p-3 bg-slate-950/50 rounded-lg border border-white/5 text-sm font-mono text-slate-300">
                  <div className="text-slate-500 mb-1 text-xs">
                    {format(new Date(sig.timestamp * 1000), 'yyyy-MM-dd HH:mm:ss')}
                  </div>
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(sig.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-slate-800/10">
            <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              Root Cause Analysis
            </h3>
            {incident.rca ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <h4 className="font-medium mb-1">RCA Submitted</h4>
                    <p className="text-sm opacity-80">This incident has been resolved and closed.</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-slate-400 mb-1">Category</div>
                    <div className="font-medium text-white bg-slate-900/50 p-2 rounded-lg border border-white/5">{incident.rca.root_cause_category}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Fix Applied</div>
                    <div className="font-medium text-white bg-slate-900/50 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{incident.rca.fix_applied}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Prevention Steps</div>
                    <div className="font-medium text-white bg-slate-900/50 p-3 rounded-lg border border-white/5 whitespace-pre-wrap">{incident.rca.prevention_steps}</div>
                  </div>
                </div>
              </div>
            ) : (
              <RCAForm incidentId={incident.id} onComplete={fetchIncident} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
