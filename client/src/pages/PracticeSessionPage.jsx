import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';

const FILLER_WORDS = ['um', 'uh', 'like', 'basically', 'you know', 'actually', 'honestly', 'so'];

export default function PracticeSessionPage() {
  const { id } = useParams();
  const [session, setSession] = useState(null);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Voice STT & Speech Analytics state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  const isSpeechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

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
    if (!session) return;
    const question = session.questions[selectedQuestionIndex];
    setAnswer(question?.userAnswer || '');
    setStatusMessage('');
    stopRecording();
    stopSpeakingQuestion();
  }, [session, selectedQuestionIndex]);

  useEffect(() => {
    return () => {
      stopRecording();
      stopSpeakingQuestion();
    };
  }, []);

  const selectedQuestion = useMemo(
    () => session?.questions?.[selectedQuestionIndex] ?? null,
    [session, selectedQuestionIndex]
  );

  // Analyze filler words and WPM
  const speechAnalytics = useMemo(() => {
    const text = answer.toLowerCase();
    const words = text.trim() ? text.trim().split(/\s+/) : [];
    const wordCount = words.length;

    const foundFillers = [];
    let fillerCount = 0;

    FILLER_WORDS.forEach((filler) => {
      const regex = new RegExp(`\\b${filler}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        fillerCount += matches.length;
        foundFillers.push({ word: filler, count: matches.length });
      }
    });

    const durationMinutes = recordingSeconds > 0 ? recordingSeconds / 60 : 0.5;
    const wpm = Math.round(wordCount / (durationMinutes || 1));

    return {
      wordCount,
      fillerCount,
      foundFillers,
      wpm,
      recordingSeconds
    };
  }, [answer, recordingSeconds]);

  const handleSelectQuestion = (index) => {
    setSelectedQuestionIndex(index);
  };

  // Text-To-Speech Question Reader
  const handleSpeakQuestion = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatusMessage('Text-to-speech is not supported in your browser.');
      return;
    }

    if (isSpeakingQuestion) {
      stopSpeakingQuestion();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(selectedQuestion.prompt);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onend = () => setIsSpeakingQuestion(false);
    utterance.onerror = () => setIsSpeakingQuestion(false);

    setIsSpeakingQuestion(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeakingQuestion = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakingQuestion(false);
  };

  // Speech-To-Text Voice Recording
  const startRecording = () => {
    if (!isSpeechSupported) {
      setStatusMessage('Voice recognition is not supported in this browser. Please use Chrome/Edge or type your answer.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = answer;

    recognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? ' ' : '') + event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setAnswer(finalTranscript + (interim ? ' ' + interim : ''));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      stopRecording();
    };

    recognition.onend = () => {
      setIsRecording(false);
      clearInterval(timerRef.current);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecordingSeconds(0);

    timerRef.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmitAnswer = async (event) => {
    event.preventDefault();
    if (!selectedQuestion) return;

    stopRecording();
    setSubmitting(true);
    setStatusMessage('');

    try {
      const response = await api.put(`/sessions/${id}/answer`, {
        questionItemId: selectedQuestion._id,
        userAnswer: answer,
        speechMetrics: {
          wpm: speechAnalytics.wpm,
          fillerWordCount: speechAnalytics.fillerCount,
          fillerWordsFound: speechAnalytics.foundFillers.map((f) => `${f.word} (${f.count})`),
          speakingDurationSeconds: recordingSeconds
        }
      });
      setSession(response.data.session);
      setStatusMessage('Answer submitted successfully and evaluated with STAR rubric!');
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

  const rubric = selectedQuestion?.rubric;
  const speechMetrics = selectedQuestion?.speechMetrics;

  return (
    <section className="practice-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Interactive AI Interview Practice</span>
          <h1>{session.category} — {session.difficulty}</h1>
          <p>Practice speaking or typing your responses, hear real-time AI audio, and receive structured STAR feedback.</p>
        </div>
      </div>

      <div className="session-layout">
        <aside className="question-sidebar">
          <h2>Questions</h2>
          <ol className="question-list">
            {session.questions.map((item, index) => (
              <li key={`${item.questionId}-${index}`} className={index === selectedQuestionIndex ? 'question-list-item active' : 'question-list-item'}>
                <button type="button" onClick={() => handleSelectQuestion(index)}>
                  Question {index + 1} {item.score ? `(Score: ${item.score}/10)` : ''}
                </button>
              </li>
            ))}
          </ol>
        </aside>

        <div className="question-panel">
          <article className="question-card">
            <div className="question-header">
              <span className="question-meta">Question {selectedQuestionIndex + 1} of {session.questions.length}</span>
              <button
                type="button"
                className={`button-audio ${isSpeakingQuestion ? 'speaking' : ''}`}
                onClick={handleSpeakQuestion}
              >
                {isSpeakingQuestion ? '⏹️ Stop Audio' : '🔊 Listen to Question'}
              </button>
            </div>
            <h2>{selectedQuestion.prompt}</h2>
            {selectedQuestion.sampleAnswer && (
              <div className="sample-answer">
                <strong>Sample Answer Framework:</strong>
                <p>{selectedQuestion.sampleAnswer}</p>
              </div>
            )}
          </article>

          {/* Voice Input & Real-time Speech Analytics */}
          <div className="voice-control-bar">
            <button
              type="button"
              className={`button-mic ${isRecording ? 'recording' : ''}`}
              onClick={toggleRecording}
              disabled={session.status === 'completed'}
            >
              {isRecording ? '⏹️ Stop Mic' : '🎙️ Record Answer (Voice STT)'}
            </button>

            {isRecording && (
              <span className="recording-badge pulse">
                🔴 Recording Live... {recordingSeconds}s
              </span>
            )}

            <div className="speech-metrics-inline">
              <span className="metric-pill">Words: {speechAnalytics.wordCount}</span>
              <span className="metric-pill">Est. WPM: {speechAnalytics.wpm}</span>
              <span className={`metric-pill ${speechAnalytics.fillerCount > 0 ? 'warning' : ''}`}>
                Fillers: {speechAnalytics.fillerCount}
              </span>
            </div>
          </div>

          <form className="answer-form" onSubmit={handleSubmitAnswer}>
            <label>
              Your Response (Speak or Type)
              <textarea
                rows="7"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Click 'Record Answer' to speak or type your detailed response here..."
                required
              />
            </label>

            {speechAnalytics.foundFillers.length > 0 && (
              <div className="filler-words-alert">
                ⚠️ <strong>Filler words detected:</strong>{' '}
                {speechAnalytics.foundFillers.map((f) => `${f.word} (${f.count})`).join(', ')}
              </div>
            )}

            <button className="button button-primary" type="submit" disabled={submitting || session.status === 'completed'}>
              {submitting ? 'Analyzing & Evaluating…' : 'Submit & Evaluate Answer'}
            </button>
          </form>

          {/* Structured STAR Rubric Feedback Cards */}
          {(rubric || selectedQuestion.aiFeedback) && (
            <section className="rubric-feedback-container">
              <div className="rubric-header">
                <h3>AI Coaching & STAR Rubric Analysis</h3>
                {selectedQuestion.score > 0 && (
                  <span className={`score-badge ${selectedQuestion.score >= 7 ? 'high' : selectedQuestion.score >= 5 ? 'med' : 'low'}`}>
                    Overall Score: {selectedQuestion.score} / 10
                  </span>
                )}
              </div>

              {rubric && (
                <div className="rubric-grid">
                  {/* STAR Method Scores */}
                  <div className="rubric-card">
                    <h4>⭐ STAR Method Scores</h4>
                    <div className="star-bars">
                      <div className="star-row">
                        <span>Situation</span>
                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(rubric.starScore?.situation || 0) * 10}%` }}></div></div>
                        <span>{rubric.starScore?.situation || 0}/10</span>
                      </div>
                      <div className="star-row">
                        <span>Task</span>
                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(rubric.starScore?.task || 0) * 10}%` }}></div></div>
                        <span>{rubric.starScore?.task || 0}/10</span>
                      </div>
                      <div className="star-row">
                        <span>Action</span>
                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(rubric.starScore?.action || 0) * 10}%` }}></div></div>
                        <span>{rubric.starScore?.action || 0}/10</span>
                      </div>
                      <div className="star-row">
                        <span>Result</span>
                        <div className="bar-bg"><div className="bar-fill" style={{ width: `${(rubric.starScore?.result || 0) * 10}%` }}></div></div>
                        <span>{rubric.starScore?.result || 0}/10</span>
                      </div>
                    </div>
                  </div>

                  {/* Dimensional Scores & Speech Delivery */}
                  <div className="rubric-card">
                    <h4>📊 Skill Ratings & Speech Delivery</h4>
                    <div className="skill-ratings">
                      <div className="rating-item">
                        <strong>Technical Depth:</strong> {rubric.technicalScore || selectedQuestion.score || 0}/10
                      </div>
                      <div className="rating-item">
                        <strong>Communication Clarity:</strong> {rubric.communicationScore || selectedQuestion.score || 0}/10
                      </div>
                      {speechMetrics && (
                        <div className="rating-item">
                          <strong>Delivery Pacing:</strong> {speechMetrics.wpm ? `${speechMetrics.wpm} WPM` : 'N/A'} (Optimal: 130-160 WPM)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strengths & Missing Points */}
                  <div className="rubric-card full-width">
                    <h4>💡 Strengths & Missing Key Elements</h4>
                    <p className="strength-text">✅ <strong>Strengths:</strong> {rubric.strengths || 'Clear logic and direct engagement with the question.'}</p>
                    {rubric.keyMissingPoints?.length > 0 && (
                      <div className="missing-points">
                        <strong>Key Missing Points to Improve:</strong>
                        <ul>
                          {rubric.keyMissingPoints.map((point, idx) => (
                            <li key={idx}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Constructive Criticism & What to Add Section */}
                  <div className="rubric-card full-width criticism-card">
                    <h4>🧐 Detailed Answer Critique & What to Add</h4>
                    {rubric.criticism && (
                      <div className="criticism-block">
                        <strong>Critique / Areas for Improvement:</strong>
                        <p>{rubric.criticism}</p>
                      </div>
                    )}

                    {rubric.whatToAdd?.length > 0 && (
                      <div className="what-to-add-block">
                        <strong>➕ Key Technical Concepts & Metrics to Add:</strong>
                        <ul>
                          {rubric.whatToAdd.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {rubric.keyTermsChecklist?.length > 0 && (
                      <div className="terms-checklist-block">
                        <strong>🏷️ Terminology Checklist:</strong>
                        <div className="terms-pills">
                          {rubric.keyTermsChecklist.map((item, idx) => (
                            <span key={idx} className={`term-pill ${item.included ? 'included' : 'missing'}`}>
                              {item.included ? '✓' : '✗'} {item.term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {rubric.recommendedAddition && (
                      <div className="recommended-snippet-block">
                        <strong>📝 Recommended Addition to Insert into Your Answer:</strong>
                        <blockquote className="recommended-box">{rubric.recommendedAddition}</blockquote>
                      </div>
                    )}
                  </div>

                  {/* Recommended Ideal Answer */}
                  {rubric.idealAnswer && (
                    <div className="rubric-card full-width ideal-answer-card">
                      <h4>🚀 Rewritten Ideal Answer</h4>
                      <p>{rubric.idealAnswer}</p>
                    </div>
                  )}
                </div>
              )}

              {!rubric && selectedQuestion.aiFeedback && (
                <div className="feedback-card">
                  <pre>{selectedQuestion.aiFeedback}</pre>
                </div>
              )}
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
