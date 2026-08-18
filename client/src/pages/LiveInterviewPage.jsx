import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLiveInterviewSocket, useAudioRecorder, useAudioPlayback, useSpeechMetrics } from '../hooks/useLiveInterview';
import './LiveInterviewPage.css';

export default function LiveInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const { socket, connected } = useLiveInterviewSocket(token);
  const { startRecording, stopRecording, isRecording, recordingTime } = useAudioRecorder();
  const { playAudio, isPlaying } = useAudioPlayback();
  const [sessionData, setSessionData] = useState(null);
  const [transcript, setTranscript] = useState([]);
  const [currentCoachResponse, setCurrentCoachResponse] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const transcriptEndRef = useRef(null);

  // Auto-scroll to latest transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      if (!socket || !connected || !sessionId) return;

      try {
        // Emit start session event
        socket.emit('start-session', { sessionId, token });

        socket.on('session-started', (data) => {
          setSessionData({ _id: sessionId, ...data });
          setTranscript(data.transcript || []);
          setSessionStarted(true);
          setLoading(false);

          // Auto-play coach introduction
          setTimeout(() => {
            playCoachIntroduction(data.transcript[0]?.text || '');
          }, 500);
        });

        socket.on('error', (data) => {
          setError(data.message);
          setLoading(false);
        });

        socket.on('transcription-complete', (data) => {
          setTranscript(prev => [
            ...prev,
            {
              speaker: 'candidate',
              text: data.text,
              timestamp: new Date()
            }
          ]);
          setMetrics(data.metrics);
        });

        socket.on('coaching-response', async (data) => {
          setCurrentCoachResponse(data);
          setTranscript(prev => [
            ...prev,
            {
              speaker: 'coach',
              text: data.nextResponse,
              timestamp: new Date()
            }
          ]);

          // Play coach voice response
          if (data.audioUrl) {
            await playAudio(data.audioUrl);
          }

          setIsAnswering(false);
        });

        socket.on('session-ended', (data) => {
          setSessionData(prev => ({
            ...prev,
            ...data.session
          }));
          navigate(`/dashboard`);
        });
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initSession();
  }, [socket, connected, sessionId, token, navigate]);

  const playCoachIntroduction = async (text) => {
    if (text && typeof text === 'string') {
      // In a real scenario, this would use TTS
      console.log('Coach:', text);
    }
  };

  const handleRecordAnswer = async () => {
    if (!isRecording) {
      await startRecording();
      setIsAnswering(true);
    } else {
      setIsAnswering(false);
      const recording = await stopRecording();

      if (recording) {
        // Send audio to server via WebSocket
        socket.emit('submit-answer', {
          sessionId,
          audioBuffer: recording.audioBuffer,
          durationSeconds: recording.durationSeconds
        });
      }
    }
  };

  const handleEndSession = () => {
    socket.emit('end-session', { sessionId });
  };

  const handleNextQuestion = () => {
    if (currentCoachResponse?.followUpQuestions?.length) {
      setCurrentCoachResponse(null);
      setMetrics(null);
    }
  };

  if (!connected) {
    return (
      <div className="live-interview-container loading">
        <div className="spinner"></div>
        <p>Connecting to live interview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="live-interview-container error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
      </div>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="live-interview-container loading">
        <div className="spinner"></div>
        <p>Starting interview session...</p>
      </div>
    );
  }

  return (
    <div className="live-interview-page">
      <div className="live-interview-header">
        <div className="header-info">
          <h1>Live Interview</h1>
          <div className="session-meta">
            <span className="badge badge-live">● LIVE</span>
            <span className="category">{sessionData?.category}</span>
            <span className="difficulty">{sessionData?.difficulty}</span>
            <span className="role">{sessionData?.targetRole}</span>
          </div>
        </div>
        <div className="timer">
          <span>Duration: {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}</span>
        </div>
      </div>

      <div className="live-interview-container">
        {/* Transcript Section */}
        <div className="transcript-section">
          <div className="transcript-header">
            <h2>Live Transcript</h2>
            <span className="rec-indicator">● REC</span>
          </div>

          <div className="transcript-content">
            {transcript.map((entry, idx) => (
              <div key={idx} className={`transcript-entry speaker-${entry.speaker}`}>
                <div className="speaker-label">{entry.speaker === 'coach' ? 'Coach' : 'You'}</div>
                <div className="speaker-text">{entry.text}</div>
                {entry.timestamp && (
                  <div className="timestamp">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
            <div ref={transcriptEndRef} />
          </div>
        </div>

        {/* Controls Section */}
        <div className="controls-section">
          <div className="question-display">
            <h3>Current Question</h3>
            <p>{sessionData?.currentQuestion || currentCoachResponse?.nextQuestion}</p>
          </div>

          {/* Metrics Display */}
          {metrics && (
            <div className="metrics-box">
              <h4>Speech Metrics</h4>
              <div className="metrics-grid">
                <div className="metric">
                  <label>WPM</label>
                  <span className={`value ${metrics.wpm > 150 ? 'high' : metrics.wpm > 100 ? 'good' : 'low'}`}>
                    {metrics.wpm}
                  </span>
                </div>
                <div className="metric">
                  <label>Confidence</label>
                  <span className={`value ${metrics.confidenceScore > 75 ? 'high' : metrics.confidenceScore > 50 ? 'medium' : 'low'}`}>
                    {metrics.confidenceScore}%
                  </span>
                </div>
                <div className="metric">
                  <label>Filler Words</label>
                  <span className={`value ${metrics.fillerWordCount === 0 ? 'good' : 'warning'}`}>
                    {metrics.fillerWordCount}
                  </span>
                </div>
                <div className="metric">
                  <label>Duration</label>
                  <span className="value">{metrics.durationSeconds}s</span>
                </div>
              </div>
              {metrics.fillerWordsFound.length > 0 && (
                <div className="filler-words">
                  <p><strong>Filler words detected:</strong></p>
                  <div className="tags">
                    {metrics.fillerWordsFound.map((word, idx) => (
                      <span key={idx} className="tag">{word}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Feedback Display */}
          {currentCoachResponse && (
            <div className="feedback-box">
              <h4>Feedback</h4>
              <p className="feedback-text">{currentCoachResponse.feedback}</p>

              <div className="feedback-details">
                {currentCoachResponse.strengths.length > 0 && (
                  <div className="strengths">
                    <h5>Strengths</h5>
                    <ul>
                      {currentCoachResponse.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {currentCoachResponse.areasForImprovement.length > 0 && (
                  <div className="improvements">
                    <h5>Areas for Improvement</h5>
                    <ul>
                      {currentCoachResponse.areasForImprovement.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="score-display">
                <div className="score">{currentCoachResponse.score}/10</div>
              </div>

              <button className="btn btn-primary" onClick={handleNextQuestion}>
                Continue to Next Question
              </button>
            </div>
          )}

          {/* Recording Controls */}
          <div className="recording-controls">
            <button
              className={`btn btn-record ${isRecording ? 'recording' : ''}`}
              onClick={handleRecordAnswer}
              disabled={isPlaying}
            >
              {isRecording ? (
                <>
                  <span className="pulse"></span>
                  Stop Recording ({recordingTime}s)
                </>
              ) : (
                '🎤 Start Recording'
              )}
            </button>

            <button
              className="btn btn-danger"
              onClick={handleEndSession}
            >
              End Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
