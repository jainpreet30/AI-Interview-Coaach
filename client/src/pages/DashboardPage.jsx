import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../contexts/AuthContext.jsx';
import ActivityHeatmap from '../components/ActivityHeatmap.jsx';

const defaultStats = {
  sessionsCompleted: 0,
  averageScore: 0,
  currentStreak: 0,
  longestStreak: 0,
  totalActiveDays: 0,
  totalQuestionsAnswered: 0,
  dailyActivity: []
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(defaultStats);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);

  useEffect(() => {
    let active = true;

    api.get('/sessions')
      .then((response) => {
        if (active) {
          setSessions(response.data.sessions || []);
          setLoadingSessions(false);
        }
      })
      .catch(() => active && setLoadingSessions(false));

    api.get('/analytics/me')
      .then((response) => {
        if (active) {
          setAnalytics(response.data.analytics || defaultStats);
          setLoadingAnalytics(false);
        }
      })
      .catch(() => active && setLoadingAnalytics(false));

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Welcome back</span>
          <h1>{user?.name || 'Student'}</h1>
          <p>Continue your interview preparation and view your latest sessions.</p>
        </div>
        <Link className="button button-primary" to="/practice/start">
          Start new session
        </Link>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card">
          <p className="stat-label">Completed sessions</p>
          <p className="stat-value">{loadingAnalytics ? '—' : analytics.sessionsCompleted}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Average score</p>
          <p className="stat-value">{loadingAnalytics ? '—' : analytics.averageScore.toFixed(1)}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Current Streak</p>
          <p className="stat-value">{loadingAnalytics ? '—' : `🔥 ${analytics.currentStreak || 0}d`}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Questions Practiced</p>
          <p className="stat-value">{loadingAnalytics ? '—' : analytics.totalQuestionsAnswered || 0}</p>
        </div>
      </div>

      {/* GitHub-style Practice Activity Contribution Calendar */}
      <div className="section-block">
        <ActivityHeatmap analytics={analytics} />
      </div>

      <div className="section-block">
        <div className="section-heading">
          <div>
            <h2>Recent sessions</h2>
            <p>Review completed mock interviews and continue work.</p>
          </div>
          <Link className="link-secondary" to="/practice/start">
            New practice session
          </Link>
        </div>

        {loadingSessions ? (
          <p>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>You do not have any sessions yet. Start your first mock interview.</p>
            <Link className="button button-secondary" to="/practice/start">
              Begin practice
            </Link>
          </div>
        ) : (
          <div className="session-list">
            {sessions.slice(0, 4).map((session) => (
              <article key={session._id} className="session-card">
                <div>
                  <p className="session-meta">{session.category} • {session.difficulty}</p>
                  <h3>Session {session._id.slice(-6)}</h3>
                  <p>Status: {session.status}</p>
                </div>
                <Link className="link-secondary" to={`/practice/${session._id}`}>
                  View session
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
