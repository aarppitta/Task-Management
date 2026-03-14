const statusConfig = {
  'Pending': {
    pill: 'bg-amber-950/50 text-amber-300 border border-amber-700/40',
    dot:  'bg-amber-400',
    glow: 'shadow-amber-500/20',
  },
  'In Progress': {
    pill: 'bg-sky-950/50 text-sky-300 border border-sky-700/40',
    dot:  'bg-sky-400',
    glow: 'shadow-sky-500/20',
  },
  'Completed': {
    pill: 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/40',
    dot:  'bg-emerald-400',
    glow: 'shadow-emerald-500/20',
  },
  'Not Completed': {
    pill: 'bg-rose-950/50 text-rose-300 border border-rose-700/40',
    dot:  'bg-rose-400',
    glow: 'shadow-rose-500/20',
  },
}

export default function StatusBadge({ status }) {
  const config = statusConfig[status] ?? {
    pill: 'bg-gray-900/60 text-gray-400 border border-gray-700/40',
    dot:  'bg-gray-500',
    glow: '',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm ${config.pill} ${config.glow}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} animate-pulse`} />
      {status}
    </span>
  )
}
