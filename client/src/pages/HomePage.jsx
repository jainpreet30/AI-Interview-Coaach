import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="hero-section">
      <div className="hero-copy">
        <span className="eyebrow">AI Interview Coach</span>
        <h1>Practice, improve, and build confidence with AI-powered mock interviews.</h1>
        <p>
          Launch your interview readiness with guided sessions, actionable AI feedback, and progress tracking built for final-year
          students.
        </p>
        <div className="hero-actions">
          {isAuthenticated ? (
            <Link className="button button-primary" to="/dashboard">
              Go to dashboard
            </Link>
          ) : (
            <>
              <Link className="button button-primary" to="/login">
                Login
              </Link>
              <Link className="button button-secondary" to="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="hero-panel">
        <div className="panel-card">
          <h2>Start your first mock session</h2>
          <p>Select a category, answer questions, and review AI feedback for each response.</p>
        </div>
        <div className="panel-card">
          <h2>Track improvement</h2>
          <p>Monitor your interview history and analytics as you practice regularly.</p>
        </div>
      </div>
    </section>
  );
}
