import { useState } from 'react';
import toast from 'react-hot-toast';
import { getSummary } from '../api/taskApi';

function fmtDate(raw) {
  const ymd = String(raw).substring(0, 10);
  return new Date(ymd + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function getYesterday() {
  const d = new Date(); d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

const STAT_CARDS = [
  { key: 'total_tasks',     label: 'Total Tasks', icon: '📋', color: '#e5e7eb', accent: 'rgba(229,231,235,0.06)', border: 'rgba(229,231,235,0.1)' },
  { key: 'completed_tasks', label: 'Completed',   icon: '✅', color: '#34d399', accent: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)'  },
  { key: 'pending_tasks',   label: 'Incomplete',  icon: '⏳', color: '#fb7185', accent: 'rgba(251,113,133,0.08)', border: 'rgba(251,113,133,0.18)' },
];

export default function SummaryView() {
  const [date, setDate]         = useState(getYesterday());
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch() {
    if (!date) return;
    setLoading(true); setError(null); setSummary(null); setSearched(true);
    try {
      const data = await getSummary(date);
      setSummary(data);
    } catch (err) {
      const errMsg = err.response?.status === 404
        ? 'no_summary'
        : (err.response?.data?.error || 'Failed to load');
      setError(errMsg);
      if (errMsg !== 'no_summary') toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  function handleDateChange(e) {
    setDate(e.target.value); setSearched(false); setSummary(null); setError(null);
  }

  const pct          = summary ? parseFloat(summary.completion_percentage) : 0;
  const circumference = 2 * Math.PI * 40;
  const dashOffset    = circumference - (pct / 100) * circumference;
  const ringColor     = pct >= 80 ? '#10b981' : pct >= 50 ? '#7c3aed' : '#f59e0b';
  const pctColor      = pct >= 80 ? '#34d399' : pct >= 50 ? '#a78bfa' : '#fbbf24';

  return (
    <div className="max-w-3xl mx-auto px-5 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-1 gradient-text">
          Daily Summary
        </h1>
        <p className="text-gray-500 text-sm">View EOD reports for any date</p>
      </div>

      {/* Date picker */}
      <div
        className="rounded-2xl p-5 mb-8 flex items-end gap-3"
        style={{ background: 'rgba(28, 16, 64, 0.5)', border: '1px solid var(--card-border)' }}
      >
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Select Date
          </label>
          <input
            type="date"
            value={date}
            onChange={handleDateChange}
            max={new Date().toISOString().split('T')[0]}
            className="input-base"
          />
        </div>
        <button onClick={handleSearch} disabled={!date || loading} className="btn-primary shrink-0">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Loading…
            </span>
          ) : 'View'}
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(109, 40, 217, 0.15)', borderTopColor: '#a78bfa' }} />
          <p className="text-gray-600 text-sm">Loading summary…</p>
        </div>

      ) : error === 'no_summary' ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(109, 40, 217, 0.08)', border: '1px solid rgba(109, 40, 217, 0.18)' }}>
            📊
          </div>
          <p className="text-white font-semibold text-lg mb-1.5">No report found</p>
          <p className="text-gray-600 text-sm">No EOD summary for {fmtDate(date)}</p>
          <p className="text-gray-700 text-xs mt-2">Trigger the EOD process to generate one</p>
        </div>

      ) : error ? (
        <div className="rounded-2xl p-5 text-center"
          style={{ background: 'rgba(225,29,72,0.07)', border: '1px solid rgba(225,29,72,0.18)' }}>
          <p className="text-rose-400 text-sm">{error}</p>
        </div>

      ) : summary ? (
        <div className="animate-fade-in space-y-5">
          <h2 className="text-white font-semibold text-lg">{fmtDate(summary.summary_date)}</h2>

          {/* Ring + stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Completion ring */}
            <div
              className="md:col-span-1 rounded-2xl p-6 flex flex-col items-center justify-center"
              style={{
                background: `radial-gradient(circle at 50% 40%, ${ringColor}12, rgba(18,13,48,0.95))`,
                border: `1px solid ${ringColor}28`,
              }}
            >
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
                  <circle cx="44" cy="44" r="40" fill="none" stroke="rgba(139,92,246,0.1)" strokeWidth="8" />
                  <circle
                    cx="44" cy="44" r="40" fill="none"
                    strokeWidth="8" strokeLinecap="round"
                    stroke={ringColor}
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold tabular-nums" style={{ color: pctColor }}>{pct}%</span>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-3 font-medium">Completion</p>
            </div>

            {/* Stat cards */}
            <div className="md:col-span-3 grid grid-cols-3 gap-3">
              {STAT_CARDS.map(({ key, label, icon, color, accent, border }) => (
                <div key={key} className="rounded-2xl p-5 flex flex-col items-center justify-center text-center"
                  style={{ background: accent, border: `1px solid ${border}` }}>
                  <div className="text-2xl mb-2">{icon}</div>
                  <div className="text-3xl font-bold tabular-nums mb-1" style={{ color }}>{summary[key]}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* EOD timestamp */}
          <div
            className="rounded-2xl p-4 flex items-center gap-4"
            style={{ background: 'rgba(109, 40, 217, 0.06)', border: '1px solid rgba(109, 40, 217, 0.18)' }}
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
              style={{ background: 'rgba(109, 40, 217, 0.15)' }}>
              ⚡
            </div>
            <div>
              <p className="text-gray-500 text-xs mb-0.5">EOD process executed at</p>
              <p className="text-white text-sm font-semibold">
                {new Date(summary.eod_executed_at).toLocaleString('en-US', {
                  weekday: 'short', year: 'numeric', month: 'short',
                  day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>

      ) : !searched ? (
        <div className="text-center py-24">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5"
            style={{ background: 'rgba(109, 40, 217, 0.08)', border: '1px solid rgba(109, 40, 217, 0.18)' }}>
            📈
          </div>
          <p className="text-white font-semibold text-lg mb-1.5">Pick a date</p>
          <p className="text-gray-600 text-sm">Select a date above to view its EOD report</p>
        </div>
      ) : null}
    </div>
  );
}
