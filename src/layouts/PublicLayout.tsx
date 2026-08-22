import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import './PublicLayout.css';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/Logo';

export default function PublicLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, handleLogout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
    <div className="public-layout">
      <header className="public-header">
        <div className="public-header-content">
          <div className="logo-wrapper">
            <Logo onClick={() => { closeMenu(); navigate('/'); }} />
          </div>

          {/* Desktop Nav */}
          <nav className="public-nav">
            <div className="nav-links">
              <a href="/#barbers" className="nav-link" onClick={(e) => handleNavClick(e, '#barbers')}>The Barbers</a>
              <a href="/#services" className="nav-link" onClick={(e) => handleNavClick(e, '#services')}>Services</a>
              <a href="/about" className="nav-link" onClick={(e) => { e.preventDefault(); closeMenu(); navigate('/about'); }}>About</a>
            </div>
            {isAuthenticated ? (
              <div className="user-menu-container" style={{ position: 'relative' }}>
                <button
                  className="hamburger-btn"
                  style={{ display: 'flex', width: 'auto', height: 'auto', padding: '0.5rem 0.8rem', gap: '4px' }}
                  onClick={() => setUserMenuOpen(prev => !prev)}
                >
                  <span className="hamburger-line" style={{ width: '16px' }} />
                  <span className="hamburger-line" style={{ width: '16px' }} />
                  <span className="hamburger-line" style={{ width: '16px' }} />
                </button>
                {userMenuOpen && (
                  <div className="user-menu-dropdown" style={{
                    position: 'absolute', top: '120%', right: '0', background: '#1A1816',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '150px'
                  }}>
                    <button 
                      className="btn-auth" 
                      style={{ width: '100%', border: 'none', textAlign: 'left', padding: '0.5rem 1rem' }} 
                      onClick={() => { setUserMenuOpen(false); navigate('/dashboard'); }}
                    >
                      Dashboard
                    </button>
                    <button 
                      className="btn-auth" 
                      style={{ width: '100%', border: 'none', textAlign: 'left', padding: '0.5rem 1rem', color: '#ff6b6b' }} 
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="btn-auth"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            )}
          </nav>

          {/* Mobile Hamburger Button */}
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
          <span className="mobile-nav-logo">
            <Logo className="small" onClick={() => { closeMenu(); navigate('/'); }} />
          </span>
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
          {isAuthenticated ? (
            <>
              <button
                className="btn-auth btn-auth-mobile"
                onClick={() => { closeMenu(); navigate('/dashboard'); }}
              >
                Dashboard
              </button>
              <button
                className="btn-auth btn-auth-mobile"
                style={{ marginTop: '1rem', borderColor: 'rgba(255, 107, 107, 0.4)', color: '#ff6b6b' }}
                onClick={() => { closeMenu(); handleLogout(); }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="btn-auth btn-auth-mobile"
              onClick={() => { closeMenu(); navigate('/login'); }}
            >
              Sign In
            </button>
          )}
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
  );
}
