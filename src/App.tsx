import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// A simple placeholder dashboard for authenticated users
function DashboardPlaceholder() {
  const { handleLogout } = useAuth();
  return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#EDE7DC' }}>
      <h1>Welcome to MR.X Dashboard</h1>
      <p>You have successfully logged in.</p>
      <button 
        onClick={handleLogout}
        style={{
          marginTop: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#A98B62',
          border: 'none',
          color: '#0B0A09',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        Sign Out
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/callback" element={<AuthCallbackPage />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        } 
      />
      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
