import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import TodayBoard from './pages/TodayBoard';
import HistoryView from './pages/HistoryView';
import SummaryView from './pages/SummaryView';

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen">
      <Navbar onEODSuccess={() => setRefreshKey((k) => k + 1)} />
      <main>
        <Routes>
          <Route path="/" element={<TodayBoard refreshKey={refreshKey} />} />
          <Route path="/history" element={<HistoryView />} />
          <Route path="/summary" element={<SummaryView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
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
  );
}
