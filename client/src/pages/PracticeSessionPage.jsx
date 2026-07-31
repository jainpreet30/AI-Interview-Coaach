import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';

export default function PracticeSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    api.get(`/sessions/${id}`)
      .then((response) => {
        if (active) {
          setSession(response.data.session);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setStatusMessage('Could not load the session.');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const question = session.questions[selectedQuestionIndex];
    setAnswer(question?.userAnswer || '');
    setStatusMessage('');
  }, [session, selectedQuestionIndex]);

  const selectedQuestion = useMemo(
    () => session?.questions?.[selectedQuestionIndex] ?? null,
    [session, selectedQuestionIndex]
  );

  const handleSelectQuestion = (index) => {
    setSelectedQuestionIndex(index);
  };

  const handleSubmitAnswer = async (event) => {
    event.preventDefault();
    if (!selectedQuestion) return;

    setSubmitting(true);
    setStatusMessage('');

    try {
      const response = await api.put(`/sessions/${id}/answer`, {
        questionItemId: selectedQuestion._id,
        userAnswer: answer
      });
      setSession(response.data.session);
      setStatusMessage('Answer submitted successfully.');
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Failed to submit the answer.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setCompleting(true);
    setStatusMessage('');

    try {
      const response = await api.post(`/sessions/${id}/complete`);
      setSession(response.data.session);
      setStatusMessage('Session completed. You can review the feedback and return to dashboard.');
    } catch (err) {
      setStatusMessage(err.response?.data?.message || 'Could not complete the session.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <section className="practice-page">
        <p>Loading session…</p>
      </section>
    );
  }

  if (!session) {
    return (
      <section className="practice-page">
        <p>{statusMessage || 'Session not found.'}</p>
      </section>
    );
  }

  return (
    <section className="practice-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Interview practice</span>
          <h1>{session.category} — {session.difficulty}</h1>
          <p>Answer the question, submit your response, and review AI coaching feedback.</p>
        </div>
      </div>

      <div className="session-layout">
        <aside className="question-sidebar">
          <h2>Questions</h2>
          <ol className="question-list">
            {session.questions.map((item, index) => (
              <li key={`${item.questionId}-${index}`} className={index === selectedQuestionIndex ? 'question-list-item active' : 'question-list-item'}>
                <button type="button" onClick={() => handleSelectQuestion(index)}>
                  Question {index + 1}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="question-panel">
          <article className="question-card">
            <p className="question-meta">Question {selectedQuestionIndex + 1} of {session.questions.length}</p>
            <h2>{selectedQuestion.prompt}</h2>
            {selectedQuestion.sampleAnswer && (
              <div className="sample-answer">
                <strong>Example:</strong>
                <p>{selectedQuestion.sampleAnswer}</p>
              </div>
            )}
          </article>

          <form className="answer-form" onSubmit={handleSubmitAnswer}>
            <label>
              Your answer
              <textarea
                rows="7"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Write your response here..."
                required
              />
            </label>
            <button className="button button-primary" type="submit" disabled={submitting || session.status === 'completed'}>
              {submitting ? 'Submitting…' : 'Submit answer'}
            </button>
          </form>

          {selectedQuestion.aiFeedback && (
            <section className="feedback-card">
              <h3>AI feedback</h3>
              <pre>{selectedQuestion.aiFeedback}</pre>
            </section>
          )}

          <div className="session-actions">
            <button className="button button-secondary" type="button" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </button>
            <button className="button button-primary" type="button" onClick={handleComplete} disabled={completing || session.status === 'completed'}>
              {completing ? 'Completing…' : session.status === 'completed' ? 'Session completed' : 'Complete session'}
            </button>
          </div>
          {statusMessage && <p className="form-note">{statusMessage}</p>}
        </div>
      </div>
    </section>
  );
}
