import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import './BarberLayout.css';
import Logo from '../components/Logo';

export default function BarberLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <ToastProvider>
      <div className="barber-layout">
        {/* Mobile Header */}
        <div className="mobile-header">
          <div className="logo-wrapper" style={{ display: 'flex', alignItems: 'center' }}>
            <Logo className="small" onClick={() => navigate('/barber')} />
          </div>
          <button className="menu-toggle" onClick={toggleSidebar}>
            ☰
          </button>
        </div>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar}></div>}

        {/* Sidebar */}
        <aside className={`barber-sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <div className="logo-wrapper">
              <Logo onClick={() => navigate('/barber')} />
            </div>
            <button className="close-sidebar" onClick={closeSidebar}>×</button>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/barber" end className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeSidebar}>
              <span className="nav-icon">📅</span> Dashboard
            </NavLink>
            <NavLink to="/barber/working-hours" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeSidebar}>
              <span className="nav-icon">⏰</span> Working Hours
            </NavLink>
            <NavLink to="/barber/settings" className={({ isActive }) => (isActive ? 'active' : '')} onClick={closeSidebar}>
              <span className="nav-icon">⚙️</span> Settings
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="barber-content">
          <Outlet />
        </main>
      </div>
    </ToastProvider>
  );
}
