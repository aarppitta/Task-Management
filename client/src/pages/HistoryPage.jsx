import { useState, useEffect } from 'react'
import { CalendarDaysIcon } from '@heroicons/react/24/outline'
import { getHistory, getDailySummary } from '../api/taskApi'
import TaskCard from '../components/TaskCard'
import EmptyState from '../components/EmptyState'

function getYesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

const summaryStats = [
  { key: 'total_tasks',         label: 'Total',         icon: '📋', border: '#a78bfa', text: 'text-violet-400',  iconBg: 'rgba(167,139,250,0.12)' },
  { key: 'completed_count',     label: 'Completed',     icon: '✅', border: '#34d399', text: 'text-emerald-400', iconBg: 'rgba(52,211,153,0.12)'  },
  { key: 'pending_count',       label: 'Pending',       icon: '⏳', border: '#f59e0b', text: 'text-amber-400',   iconBg: 'rgba(245,158,11,0.12)'  },
  { key: 'not_completed_count', label: 'Not Completed', icon: '❌', border: '#fb7185', text: 'text-rose-400',    iconBg: 'rgba(251,113,133,0.12)' },
]

function SummaryStatCard({ stat, value }) {
  return (
    <div
      className="rounded-2xl p-4 card-lift"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderTop: `2px solid ${stat.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wide ${stat.text} opacity-60`}>
          {stat.label}
        </span>
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-sm"
          style={{ background: stat.iconBg }}
        >
          {stat.icon}
        </div>
      </div>
      <p className={`text-3xl font-bold ${stat.text}`}>{value ?? 0}</p>
    </div>
  )
}

export default function HistoryPage() {
  const [selectedDate, setSelectedDate] = useState(getYesterday)
  const [tasks, setTasks] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setSummary(null)
      setTasks([])
      try {
        const [historyData, summaryData] = await Promise.allSettled([
          getHistory(selectedDate),
          getDailySummary(selectedDate),
        ])
        if (historyData.status === 'fulfilled') setTasks(historyData.value ?? [])
        if (summaryData.status === 'fulfilled') setSummary(summaryData.value ?? null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [selectedDate])

  const completionPct = summary
    ? Math.round(Number(summary.completion_percentage ?? 0))
    : 0

  return (
    <div className="space-y-6 animate-fade-in-slow">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">History</h1>
        <p className="text-gray-500 text-sm mt-1 font-medium">Browse your archived daily tasks</p>
      </div>

      {/* Date picker card */}
      <div
        className="rounded-2xl p-5 flex items-center gap-4"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.35)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(109,40,217,0.3), rgba(168,85,247,0.3))',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          <CalendarDaysIcon className="w-5 h-5 text-violet-300" />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
            Select a date
          </label>
          <input
            type="date"
            value={selectedDate}
            max={getYesterday()}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            style={{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }}
          />
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-xs text-gray-600 font-medium">{formatDate(selectedDate)}</p>
        </div>
      </div>

      {/* Loading spinner */}
      {isLoading && (
        <div className="flex justify-center py-12">
          <div
            className="w-8 h-8 rounded-full animate-spin"
            style={{
              border: '2px solid rgba(139, 92, 246, 0.15)',
              borderTop: '2px solid #a78bfa',
            }}
          />
        </div>
      )}

      {!isLoading && (
        <>
          {summary && (
            <div className="space-y-4">
              {/* Summary stat grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {summaryStats.map((stat) => (
                  <SummaryStatCard key={stat.key} stat={stat} value={summary[stat.key]} />
                ))}
              </div>

              {/* Progress bar card */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'var(--card)',
                  border: '1px solid var(--card-border)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-400">Completion Rate</span>
                  <span className="text-xl font-bold gradient-text">{completionPct}%</span>
                </div>
                <div
                  className="w-full rounded-full h-2.5 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <div
                    className="h-2.5 rounded-full transition-all duration-700"
                    style={{
                      width: `${completionPct}%`,
                      background: 'linear-gradient(90deg, #6d28d9, #a855f7, #ec4899)',
                      boxShadow: '0 0 8px rgba(167,139,250,0.5)',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1.5">
                  {summary.completed_count ?? 0} of {summary.total_tasks ?? 0} tasks completed
                </p>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to right, rgba(109,40,217,0.4), transparent)' }} />
            <span className="text-xs font-semibold text-violet-500 tracking-widest uppercase">
              Tasks from {formatDate(selectedDate)}
            </span>
            <div className="h-px flex-1" style={{ background: 'linear-gradient(to left, rgba(109,40,217,0.4), transparent)' }} />
          </div>

          {/* Task list (read-only) */}
          {tasks.length === 0 ? (
            <EmptyState message={`No archived tasks for ${formatDate(selectedDate)}.`} />
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
