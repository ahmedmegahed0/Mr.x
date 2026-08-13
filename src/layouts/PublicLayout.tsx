import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './PublicLayout.css';
import { useAuth } from '../context/AuthContext';

export default function PublicLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="public-header-content">
          <div className="logo" onClick={() => navigate('/barbers')}>
            MR.X
          </div>
          <nav className="public-nav">
            <button 
              className="btn-auth" 
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </button>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>
      
      <footer className="public-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} MR.X Barbershop. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
