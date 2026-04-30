import React, { useState } from 'react';

const API_BASE = 'http://localhost:8000/api/v1';

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
      
      onComplete(); // Refresh parent
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Root Cause Category</label>
        <select 
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none"
          value={formData.root_cause_category}
          onChange={e => setFormData({...formData, root_cause_category: e.target.value})}
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Fix Applied</label>
        <textarea 
          required
          rows={3}
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none resize-none"
          placeholder="Describe what was done to mitigate the issue..."
          value={formData.fix_applied}
          onChange={e => setFormData({...formData, fix_applied: e.target.value})}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Prevention Steps</label>
        <textarea 
          required
          rows={3}
          className="w-full bg-slate-900 border border-white/10 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none resize-none"
          placeholder="How will we prevent this from happening again?"
          value={formData.prevention_steps}
          onChange={e => setFormData({...formData, prevention_steps: e.target.value})}
        />
      </div>

      <button 
        type="submit" 
        disabled={submitting}
        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting RCA...' : 'Submit RCA & Close Incident'}
      </button>
    </form>
  );
}
