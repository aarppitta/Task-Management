import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { triggerEOD } from '../api/taskApi';

const navLinkClass = ({ isActive }) =>
  `relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
    isActive
      ? 'text-white'
      : 'text-gray-400 hover:text-gray-100 hover:bg-white/5'
  }`;

export default function Navbar({ onEODSuccess }) {
  const [triggering, setTriggering] = useState(false);

  async function handleTriggerEOD() {
    const confirmed = window.confirm(
      'Run End-of-Day for TODAY?\n\nThis archives all tasks and sends an email summary.'
    );
    if (!confirmed) return;
    setTriggering(true);
    try {
      const res = await triggerEOD();
      const { data } = res;
      toast.success(
        `EOD complete — ${data.completedTasks}/${data.totalTasks} tasks completed (${data.completionPercentage}%)`
      );
      onEODSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'EOD failed');
    } finally {
      setTriggering(false);
    }
  }

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        background: 'linear-gradient(135deg, rgba(7,4,26,0.92) 0%, rgba(15,7,40,0.92) 50%, rgba(26,9,53,0.92) 100%)',
        backdropFilter: 'blur(20px)',
        borderColor: 'rgba(109, 40, 217, 0.25)',
        boxShadow: '0 4px 24px rgba(109, 40, 217, 0.15)',
      }}
    >
      {/* Subtle violet glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #7c3aed, #a855f7, #db2777, transparent)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #4c1d95, #6d28d9)',
              boxShadow: '0 0 12px rgba(109, 40, 217, 0.5)',
            }}
          >
            <CheckCircleIcon className="w-5 h-5 text-violet-200" />
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #c4b5fd, #e879f9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Daily Tasks
          </span>
        </div>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {[
            { to: '/', label: 'Today', end: true },
            { to: '/history', label: 'History' },
            { to: '/summary', label: 'Summary' },
          ].map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl"
                      style={{ background: 'linear-gradient(135deg, rgba(109,40,217,0.2), rgba(139,92,246,0.2))' }}
                    />
                  )}
                  <span className="relative">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* EOD Button */}
        <button
          onClick={handleTriggerEOD}
          disabled={triggering}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{
            background: triggering
              ? 'rgba(225,29,72,0.15)'
              : 'linear-gradient(135deg, rgba(225,29,72,0.9), rgba(190,18,60,0.9))',
            border: '1px solid rgba(225,29,72,0.3)',
            color: '#fff',
            boxShadow: triggering ? 'none' : '0 4px 15px rgba(225,29,72,0.25)',
          }}
        >
          {triggering ? (
            <>
              <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Running…
            </>
          ) : (
            <>
              <span className="text-base leading-none">🌙</span>
              Trigger EOD
            </>
          )}
        </button>
      </div>
    </nav>
  );
}
