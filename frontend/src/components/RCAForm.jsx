import React, { useState } from 'react';

const API_BASE = '/api/v1';

export default function RCAForm({ incidentId, onComplete }) {
  const [formData, setFormData] = useState({
    root_cause_category: 'Software Bug',
    fix_applied: '',
    prevention_steps: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const categories = [
    'Software Bug',
    'Hardware Failure',
    'Network Outage',
    'Configuration Error',
    'Third-Party Service',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/incidents/${incidentId}/rca`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to submit RCA');
      
      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-300">
      <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg mb-4">
        <p className="text-amber-400/90 text-xs leading-relaxed">
          Incident is in <strong className="text-amber-400 font-bold">INVESTIGATING</strong> state. 
          Document the Root Cause Analysis to formally close this ticket.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}
      
      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Root Cause Category</label>
        <select 
          className="w-full glass-input rounded-md p-2.5 text-sm text-zinc-200"
          value={formData.root_cause_category}
          onChange={e => setFormData({...formData, root_cause_category: e.target.value})}
        >
          {categories.map(c => <option key={c} value={c} className="bg-zinc-900">{c}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Fix Applied</label>
        <textarea 
          required
          rows={3}
          className="w-full glass-input rounded-md p-3 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none"
          placeholder="Describe how the incident was mitigated..."
          value={formData.fix_applied}
          onChange={e => setFormData({...formData, fix_applied: e.target.value})}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prevention Steps</label>
        <textarea 
          required
          rows={3}
          className="w-full glass-input rounded-md p-3 text-sm text-zinc-200 placeholder:text-zinc-600 resize-none"
          placeholder="Steps taken to prevent recurrence..."
          value={formData.prevention_steps}
          onChange={e => setFormData({...formData, prevention_steps: e.target.value})}
        />
      </div>

      <button 
        type="submit" 
        disabled={submitting}
        className="w-full bg-white text-black hover:bg-zinc-200 font-semibold py-2.5 px-4 rounded-md transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 text-sm flex justify-center items-center gap-2"
      >
        {submitting ? (
          <><div className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin"/> Processing...</>
        ) : (
          'Resolve Incident'
        )}
      </button>
    </form>
  );
}
