import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './PublicLayout.css';
import { useAuth } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

export default function PublicLayout() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
    e.preventDefault();
    closeMenu();
    
    if (window.location.pathname !== '/') {
      navigate('/' + hash);
      // Wait for page to render then scroll
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      window.history.pushState(null, '', hash);
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ToastProvider>
      <div className="public-layout">
        <header className="public-header">
          <div className="public-header-content">
            <div className="logo" onClick={() => { closeMenu(); navigate('/'); }}>
              MR.X
            </div>

            {/* Desktop Nav */}
            <nav className="public-nav">
              <div className="nav-links">
                <a href="/#barbers" className="nav-link" onClick={(e) => handleNavClick(e, '#barbers')}>The Barbers</a>
                <a href="/#services" className="nav-link" onClick={(e) => handleNavClick(e, '#services')}>Services</a>
                <a href="/about" className="nav-link" onClick={(e) => { e.preventDefault(); closeMenu(); navigate('/about'); }}>About</a>
              </div>
              <button
                className="btn-auth"
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Dashboard' : 'Sign In'}
              </button>
            </nav>

            {/* Hamburger Button */}
            <button
              className={`hamburger-btn${menuOpen ? ' is-open' : ''}`}
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <span className="hamburger-line" />
              <span className="hamburger-line" />
              <span className="hamburger-line" />
            </button>
          </div>
        </header>

        {/* Mobile Menu Overlay */}
        <div
          className={`mobile-menu-overlay${menuOpen ? ' is-open' : ''}`}
          onClick={closeMenu}
        />

        {/* Mobile Drawer */}
        <nav className={`mobile-nav-drawer${menuOpen ? ' is-open' : ''}`}>
          <div className="mobile-nav-header">
            <span className="mobile-nav-logo">MR.X</span>
            <button className="mobile-nav-close" onClick={closeMenu} aria-label="Close menu">
              &#x2715;
            </button>
          </div>
          <div className="mobile-nav-links">
            <a href="/#barbers" className="mobile-nav-link" onClick={(e) => handleNavClick(e, '#barbers')}>The Barbers</a>
            <a href="/#services" className="mobile-nav-link" onClick={(e) => handleNavClick(e, '#services')}>Services</a>
            <a href="/about" className="mobile-nav-link" onClick={(e) => { e.preventDefault(); closeMenu(); navigate('/about'); }}>About</a>
          </div>
          <div className="mobile-nav-footer">
            <button
              className="btn-auth btn-auth-mobile"
              onClick={() => { closeMenu(); navigate(isAuthenticated ? '/dashboard' : '/login'); }}
            >
              {isAuthenticated ? 'Dashboard' : 'Sign In'}
            </button>
          </div>
        </nav>

        <main className="public-main">
          <Outlet />
        </main>

        <footer className="public-footer">
          <div className="footer-content">
            <p>&copy; {new Date().getFullYear()} MR.X Barbershop. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </ToastProvider>
  );
}
