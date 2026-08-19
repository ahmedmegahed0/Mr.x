import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';
import './AdminLayout.css';

export default function AdminLayout() {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const onLogout = async () => {
    await handleLogout();
    navigate('/login');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <ToastProvider>
      <div className="admin-layout">
        {/* Mobile Header for Hamburger */}
        <div className="mobile-header">
          <div className="mobile-logo">
            <h2>MR.X</h2>
            <span>Admin</span>
          </div>
          <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
            ☰
          </button>
        </div>

        {/* Overlay for mobile when sidebar is open */}
        {isMobileMenuOpen && (
          <div className="mobile-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <aside className={`admin-sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
          <div className="admin-sidebar-header">
            <h2>MR.X</h2>
            <span>Admin Portal</span>
          </div>
          
          <nav className="admin-nav">
            <NavLink 
              to="/admin" 
              end
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Dashboard
            </NavLink>
            <NavLink 
              to="/admin/bookings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Bookings
            </NavLink>
            <NavLink 
              to="/admin/users" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Users
            </NavLink>
            <NavLink 
              to="/admin/coupons" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Coupons
            </NavLink>
            <NavLink 
              to="/admin/barbers" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Barbers
            </NavLink>
            <NavLink 
              to="/admin/services" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Services
            </NavLink>
            <NavLink 
              to="/admin/settings" 
              onClick={() => setIsMobileMenuOpen(false)}
              className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}
            >
              Settings
            </NavLink>
            <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid rgba(169, 139, 98, 0.2)' }}></div>
            <NavLink 
              to="/" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="admin-nav-link public-link"
              target="_blank"
            >
              View Public Site ↗
            </NavLink>
          </nav>

          <button className="admin-logout-btn" onClick={onLogout}>
            Sign Out
          </button>
        </aside>

        <main className="admin-content">
          <div className="admin-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </ToastProvider>
  );
}

