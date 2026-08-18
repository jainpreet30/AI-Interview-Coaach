import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="topbar">
      <div className="brand">
        <Link to="/" className="brand-link">
          <span className="brand-badge">⚡</span>
          <span className="brand-title">AI Interview Coach</span>
        </Link>
      </div>

      <nav className="topnav">
        <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          Home
        </Link>

        {isAuthenticated ? (
          <>
            <Link to="/practice/start" className={`nav-link ${isActive('/practice/start') ? 'active' : ''}`}>
              Start Interview
            </Link>
            <Link to="/dashboard" className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
              Dashboard
            </Link>
            <div className="nav-user-wrapper">
              <span className="nav-user">👤 {user?.name || 'User'}</span>
              <button type="button" className="button-logout-sm" onClick={logout} title="Sign Out">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#features" className="nav-link">Features</a>
            <Link to="/login" className="nav-link">
              Sign In
            </Link>
            <Link to="/register" className="button button-nav-cta">
              Get Started →
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
