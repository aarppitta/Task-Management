import { NavLink } from 'react-router-dom'
import { CheckCircleIcon } from '@heroicons/react/24/solid'

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    [
      'text-sm font-semibold px-4 py-1.5 rounded-full transition-all duration-200',
      isActive
        ? 'bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40'
        : 'text-gray-400 hover:text-gray-100 hover:bg-white/5',
    ].join(' ')

  return (
    <nav
      className="sticky top-0 z-20"
      style={{
        background: 'linear-gradient(135deg, #07041a 0%, #0f0728 50%, #1a0935 100%)',
        borderBottom: '1px solid rgba(109, 40, 217, 0.25)',
        boxShadow: '0 4px 24px rgba(109, 40, 217, 0.2)',
      }}
    >
      {/* Subtle violet glow line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, #7c3aed, #a855f7, #db2777, transparent)',
        }}
      />

      <div className="relative max-w-3xl mx-auto px-6 py-3.5 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
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
        <div className="flex items-center gap-1.5">
          <NavLink to="/" end className={linkClass}>
            Today&apos;s Board
          </NavLink>
          <NavLink to="/history" className={linkClass}>
            History
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
