import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CustomerLayout.css';
import Logo from '../components/Logo';

export default function CustomerLayout() {
  const { handleLogout } = useAuth();

  return (
    <div className="customer-layout">
      {/* Sidebar Navigation */}
      <aside className="customer-sidebar">
        <div className="sidebar-brand">
          <Link to="/"><Logo /></Link>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/barbers" className={({ isActive }) => isActive ? 'active' : ''}>
                Book a Barber
              </NavLink>
            </li>
            <li>
              <NavLink to="/bookings" className={({ isActive }) => isActive ? 'active' : ''}>
                My Bookings
              </NavLink>
            </li>
            
            <div className="nav-divider" style={{ margin: '1rem 0', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}></div>
            <li>
              <NavLink 
                to="/" 
                target="_blank"
                style={{ color: '#d4af37', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
              >
                View Public Site ↗
              </NavLink>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-email">Customer</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="customer-main">
        <header className="customer-header-mobile">
          <Link to="/" className="mobile-brand"><Logo className="small" /></Link>
          <button className="btn-menu">☰</button>
        </header>
        <main className="customer-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
