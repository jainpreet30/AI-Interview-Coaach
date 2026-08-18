import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function AnnouncementBar() {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="announcement-bar">
      <div className="announcement-content">
        <span className="announcement-badge">✨ WHAT'S NEW</span>
        <span className="announcement-text">
          Adaptive AI Follow-up Questions, Resume & Job Description Personalization, and AI Interviewer Personas are now live!
        </span>
        <Link to="/practice/start" className="announcement-link">
          Try Personalized Practice →
        </Link>
      </div>
      <button
        type="button"
        className="announcement-close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss Announcement"
      >
        ✕
      </button>
    </div>
  );
}
