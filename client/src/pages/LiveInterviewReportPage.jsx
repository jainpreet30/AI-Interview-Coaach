import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api.js';

function scoreOutOf100(value) {
  if (value == null) return 'N/A';
  return `${Math.round(value > 10 ? value : value * 10)}/100`;
}

export default function LiveInterviewReportPage() {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get(`/live-sessions/${sessionId}`)
      .then((response) => {
        if (active) setSession(response.data.session);
      })
      .catch(() => {
        if (active) setError('Could not load this interview report.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [sessionId]);

  if (loading) return <section className="practice-page"><p>Loading interview report...</p></section>;
  if (error || !session) return <section className="practice-page"><p>{error || 'Report not found.'}</p></section>;

  const metrics = session.metrics || {};
  const turns = session.turns || [];

  return (
    <section className="practice-page live-report-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Live Interview Evaluation</span>
          <h1>{session.category} interview report</h1>
          <p>{session.targetRole} · {session.difficulty} · {session.interviewerPersona}</p>
        </div>
        <Link className="button button-primary" to="/dashboard">Back to Dashboard</Link>
      </div>

      <div className="dashboard-grid">
        <div className="stat-card highlight"><p className="stat-label">Overall Score</p><p className="stat-value">{scoreOutOf100(metrics.overallScore)}</p></div>
        <div className="stat-card"><p className="stat-label">Technical Depth</p><p className="stat-value">{scoreOutOf100(metrics.technicalScore)}</p></div>
        <div className="stat-card"><p className="stat-label">Communication</p><p className="stat-value">{scoreOutOf100(metrics.communicationScore)}</p></div>
        <div className="stat-card"><p className="stat-label">Speech Confidence</p><p className="stat-value">{scoreOutOf100(metrics.confidenceScore)}</p></div>
      </div>

      <div className="dashboard-two-col">
        <div className="dashboard-card-block">
          <h3>Delivery Metrics</h3>
          <p>Average pace: <strong>{metrics.averageWPM || 0} WPM</strong></p>
          <p>Filler words: <strong>{metrics.fillerWordCount || 0}</strong></p>
          <p>Speaking time: <strong>{metrics.totalSpeakingTime || 0}s</strong></p>
          <p>Questions answered: <strong>{turns.length}</strong></p>
        </div>
        <div className="dashboard-card-block ai-recommendation-card">
          <h3>Next Practice Focus</h3>
          <p className="rec-text">{turns.at(-1)?.evaluation?.areasForImprovement?.[0] || 'Keep practicing structured answers with concrete examples and measurable outcomes.'}</p>
          <Link className="button button-primary button-full" to="/live-interview/start">Practice Another Live Interview</Link>
        </div>
      </div>

      <div className="section-block">
        <div className="section-heading"><div><h2>Question-by-question review</h2><p>Every question, answer, evaluation, and follow-up is saved for review.</p></div></div>
        <div className="session-list">
          {turns.map((turn, index) => (
            <article className="session-card-redesigned" key={`${turn.askedAt || turn.timestamp}-${index}`}>
              <div className="session-card-info">
                <div className="session-card-badges"><span className="cat-pill">Question {index + 1}</span><span className="role-pill">Score {scoreOutOf100(turn.evaluation?.score)}</span></div>
                <h4>{turn.question}</h4>
                <p>{turn.answer}</p>
                <p className="session-questions-count">{turn.evaluation?.feedback}</p>
                {turn.followUpQuestion && <p className="session-questions-count"><strong>Follow-up:</strong> {turn.followUpQuestion}</p>}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
