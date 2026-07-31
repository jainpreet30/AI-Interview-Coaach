import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function NavBar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="topbar">
      <div className="brand">
        <Link to="/">AI Interview Coach</Link>
      </div>
      <nav className="topnav">
        <Link to="/">Home</Link>
        {isAuthenticated ? (
          <>
            <Link to="/dashboard">Dashboard</Link>
            <button type="button" className="button-text" onClick={logout}>
              Logout
            </button>
            <span className="nav-user">{user?.name}</span>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
