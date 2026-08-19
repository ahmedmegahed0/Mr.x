import { NavLink, Outlet, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './CustomerLayout.css';

export default function CustomerLayout() {
  const { handleLogout } = useAuth();

  return (
    <div className="customer-layout">
      {/* Sidebar Navigation */}
      <aside className="customer-sidebar">
        <div className="sidebar-brand">
          <Link to="/">MR.X</Link>
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
            {/* Can add more links later like Profile */}
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
          <Link to="/" className="mobile-brand">MR.X</Link>
          <button className="btn-menu">☰</button>
        </header>
        <main className="customer-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
