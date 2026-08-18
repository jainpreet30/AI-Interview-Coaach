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
  readinessScore: 75,
  skillsBreakdown: {
    technicalDepth: 84,
    communicationClarity: 82,
    problemSolving: 76,
    starCompliance: 70,
    deliveryPacing: 80
  },
  aiRecommendation: {
    weakestSkill: 'STAR Compliance & Result Metrics',
    recommendationText: 'Your answers show good technical knowledge, but lack explicit quantifiable results (e.g., % latency reduction). Practice 3 behavioral/technical mock interviews focused on STAR impact.',
    recommendedCategory: 'Behavioral'
  },
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

  const readiness = analytics.readinessScore || 75;
  const skills = analytics.skillsBreakdown || defaultStats.skillsBreakdown;
  const rec = analytics.aiRecommendation || defaultStats.aiRecommendation;

  // Format score nicely (e.g. 8.2 -> 82/100)
  const formatScore = (val) => {
    if (!val) return 'N/A';
    const num = val > 10 ? val : val * 10;
    return `${Math.round(num)}/100`;
  };

  return (
    <section className="dashboard-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">Personalized AI Intelligence</span>
          <h1>Welcome back, {user?.name || 'Candidate'}</h1>
          <p>Track your interview readiness score, skill masteries, and active practice streak.</p>
        </div>
        <div className="header-buttons">
          <Link className="button button-primary button-lg" to="/practice/start">
            Start Mock Session →
          </Link>
          <Link className="button button-success button-lg" to="/live-interview/start">
            🎤 Live Interview →
          </Link>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="dashboard-grid">
        <div className="stat-card highlight">
          <p className="stat-label">Interview Readiness Score</p>
          <div className="readiness-stat">
            <span className="readiness-num">{loadingAnalytics ? '—' : `${readiness}%`}</span>
            <span className="readiness-badge">{readiness >= 75 ? '🔥 Interview Ready' : '⚡ Building Skills'}</span>
          </div>
        </div>

        <div className="stat-card">
          <p className="stat-label">Completed Mock Sessions</p>
          <p className="stat-value">{loadingAnalytics ? '—' : analytics.sessionsCompleted}</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Average Performance</p>
          <p className="stat-value">{loadingAnalytics ? '—' : formatScore(analytics.averageScore)}</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Active Practice Streak</p>
          <p className="stat-value">{loadingAnalytics ? '—' : `🔥 ${analytics.currentStreak || 0} Days`}</p>
        </div>
      </div>

      {/* Skill Breakdown & AI Recommendation Row */}
      <div className="dashboard-two-col">
        {/* Skill Mastery Breakdown */}
        <div className="dashboard-card-block">
          <h3>📊 Candidate Skill Breakdown</h3>
          <div className="skill-bars-list">
            <div className="skill-bar-row">
              <div className="skill-bar-header">
                <span>Technical Depth & Accuracy</span>
                <strong>{skills.technicalDepth}%</strong>
              </div>
              <div className="skill-track"><div className="skill-fill" style={{ width: `${skills.technicalDepth}%` }}></div></div>
            </div>

            <div className="skill-bar-row">
              <div className="skill-bar-header">
                <span>Communication & Articulation</span>
                <strong>{skills.communicationClarity}%</strong>
              </div>
              <div className="skill-track"><div className="skill-fill" style={{ width: `${skills.communicationClarity}%` }}></div></div>
            </div>

            <div className="skill-bar-row">
              <div className="skill-bar-header">
                <span>Problem Solving & Logic</span>
                <strong>{skills.problemSolving}%</strong>
              </div>
              <div className="skill-track"><div className="skill-fill" style={{ width: `${skills.problemSolving}%` }}></div></div>
            </div>

            <div className="skill-bar-row">
              <div className="skill-bar-header">
                <span>STAR Framework Compliance</span>
                <strong>{skills.starCompliance}%</strong>
              </div>
              <div className="skill-track"><div className="skill-fill" style={{ width: `${skills.starCompliance}%` }}></div></div>
            </div>
          </div>
        </div>

        {/* AI Personal Coach Recommendation Card */}
        <div className="dashboard-card-block ai-recommendation-card">
          <div className="rec-header">
            <span className="rec-icon">🤖</span>
            <div>
              <h3>AI Coach Recommendation</h3>
              <span className="focus-badge">Focus Area: {rec.weakestSkill}</span>
            </div>
          </div>
          <p className="rec-text">{rec.recommendationText}</p>
          <div className="rec-cta">
            <Link className="button button-primary button-full" to="/practice/start">
              Practice Recommended Topic ({rec.recommendedCategory}) →
            </Link>
          </div>
        </div>
      </div>

      {/* GitHub-style Practice Activity Contribution Calendar */}
      <div className="section-block">
        <ActivityHeatmap analytics={analytics} />
      </div>

      {/* Recent Sessions List */}
      <div className="section-block">
        <div className="section-heading">
          <div>
            <h2>Recent Mock Interviews</h2>
            <p>Review completed mock sessions and track question feedback.</p>
          </div>
          <Link className="link-secondary" to="/practice/start">
            New Mock Session →
          </Link>
        </div>

        {loadingSessions ? (
          <p>Loading sessions…</p>
        ) : sessions.length === 0 ? (
          <div className="empty-state">
            <p>You haven't completed any mock interviews yet. Start your first session to unlock AI readiness metrics!</p>
            <Link className="button button-secondary" to="/practice/start">
              Begin Practice
            </Link>
          </div>
        ) : (
          <div className="session-list">
            {sessions.slice(0, 5).map((session) => (
              <article key={session._id} className="session-card-redesigned">
                <div className="session-card-info">
                  <div className="session-card-badges">
                    <span className="cat-pill">{session.category}</span>
                    <span className="role-pill">{session.targetRole || 'Software Engineer'}</span>
                    <span className="diff-pill">{session.difficulty}</span>
                  </div>
                  <h4>Session #{session._id.slice(-6)}</h4>
                  <p className="session-questions-count">
                    {session.questions ? session.questions.length : 5} Questions • Status: <strong>{session.status}</strong>
                  </p>
                </div>

                <div className="session-card-right">
                  <div className="session-score-display">
                    <span className="score-label">Score</span>
                    <strong className="score-value">{formatScore(session.overallScore)}</strong>
                  </div>
                  <Link className="button button-secondary button-sm" to={`/practice/${session._id}`}>
                    View Report →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
