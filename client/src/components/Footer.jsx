import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="brand-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">AI Interview Coach</span>
          </div>
          <p className="footer-tagline">
            Simulate real interviews, get instant AI evaluation, and master technical & behavioral skills to land your next job opportunity.
          </p>
          <div className="footer-socials">
            <span className="social-badge">🤖 Powered by AI</span>
            <span className="social-badge">⚡ Real-time Feedback</span>
          </div>
        </div>

        <div className="footer-links-grid">
          <div className="footer-column">
            <h4>Product</h4>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/practice/start">Start Interview</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Categories</h4>
            <ul>
              <li><Link to="/practice/start">Data Structures</Link></li>
              <li><Link to="/practice/start">Algorithms</Link></li>
              <li><Link to="/practice/start">System Design</Link></li>
              <li><Link to="/practice/start">Behavioral (STAR)</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Features</h4>
            <ul>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#features">AI Evaluation</a></li>
              <li><a href="#features">Voice Answering</a></li>
              <li><a href="#features">Speech Analytics</a></li>
            </ul>
          </div>

          <div className="footer-column">
            <h4>Account</h4>
            <ul>
              <li><Link to="/login">Sign In</Link></li>
              <li><Link to="/register">Create Account</Link></li>
              <li><Link to="/dashboard">My Analytics</Link></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 AI Interview Coach. Built with AI for intelligent interview preparation.</p>
      </div>
    </footer>
  );
}
