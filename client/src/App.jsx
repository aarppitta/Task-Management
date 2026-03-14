import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import TodayBoard from './pages/TodayBoard'
import HistoryPage from './pages/HistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Navbar />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<TodayBoard />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </main>
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontSize: '13px',
              background: '#1c1040',
              color: '#e5e7eb',
              border: '1px solid #2e1f62',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
              borderRadius: '12px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#1c1040' },
            },
            error: {
              iconTheme: { primary: '#fb7185', secondary: '#1c1040' },
            },
          }}
        />
      </div>
    </BrowserRouter>
  )
}
