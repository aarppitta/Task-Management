import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'

export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 animate-fade-in-slow">
      {/* Dark glowing icon pod */}
      <div
        className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
        style={{
          background: 'linear-gradient(135deg, #2e1065 0%, #3b0764 50%, #581c87 100%)',
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.07)',
        }}
      >
        <ClipboardDocumentListIcon className="w-10 h-10 text-violet-300" />
      </div>

      <p className="text-gray-300 font-medium text-sm">{message}</p>
      <p className="text-gray-600 text-xs mt-1">Nothing here yet — you&apos;re all clear!</p>

      {/* Decorative glowing dots */}
      <div className="flex gap-2 mt-5">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500 shadow-sm shadow-violet-500/50" />
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-sm shadow-purple-500/50" />
        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 shadow-sm shadow-fuchsia-500/50" />
      </div>
    </div>
  )
}
