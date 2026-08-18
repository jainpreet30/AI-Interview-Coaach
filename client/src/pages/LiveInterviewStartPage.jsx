import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './LiveInterviewStartPage.css';

export default function LiveInterviewStartPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    category: 'Data Structures',
    difficulty: 'medium',
    targetRole: 'Software Engineer',
    interviewerPersona: 'faang-lead'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartInterview = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/v1/live-sessions', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const sessionId = response.data.session._id;
      navigate(`/live-interview/${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start interview');
      setLoading(false);
    }
  };

  return (
    <div className="live-interview-start-page">
      <div className="container">
        <div className="header">
          <h1>Start Live Interview</h1>
          <p>Practice with a live AI coach using voice</p>
        </div>

        <form onSubmit={handleStartInterview} className="interview-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="category">Interview Category</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="Data Structures">Data Structures</option>
              <option value="Algorithms">Algorithms</option>
              <option value="System Design">System Design</option>
              <option value="Behavioral">Behavioral</option>
              <option value="General">General</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="difficulty">Difficulty Level</label>
            <div className="difficulty-options">
              {['easy', 'medium', 'hard'].map(level => (
                <label key={level} className="radio-option">
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={formData.difficulty === level}
                    onChange={handleInputChange}
                  />
                  <span>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="targetRole">Target Role</label>
            <input
              type="text"
              id="targetRole"
              name="targetRole"
              placeholder="e.g., Senior Frontend Engineer"
              value={formData.targetRole}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="interviewerPersona">Interviewer Persona</label>
            <select
              id="interviewerPersona"
              name="interviewerPersona"
              value={formData.interviewerPersona}
              onChange={handleInputChange}
            >
              <option value="faang-lead">FAANG Lead (Rigorous)</option>
              <option value="startup">Startup CTO (Pragmatic)</option>
              <option value="mentor">Mentor (Supportive)</option>
              <option value="strict">Strict Interviewer</option>
              <option value="friendly">Friendly Interviewer</option>
            </select>
          </div>

          <div className="features-list">
            <h3>What's Included:</h3>
            <ul>
              <li>✓ Real-time AI coaching and feedback</li>
              <li>✓ Live transcription of your responses</li>
              <li>✓ Speech metrics (WPM, filler words, confidence)</li>
              <li>✓ Real-time scoring and evaluation</li>
              <li>✓ Interview recording and playback</li>
            </ul>
          </div>

          <div className="permissions-notice">
            <p>
              <strong>Note:</strong> You'll need to allow microphone access to use the live interview feature.
            </p>
          </div>

          <button
            type="submit"
            className="btn btn-start"
            disabled={loading}
          >
            {loading ? 'Starting Interview...' : '🎤 Start Live Interview'}
          </button>
        </form>

        <div className="help-section">
          <h3>Tips for the Live Interview:</h3>
          <ul>
            <li>Speak clearly and at a natural pace</li>
            <li>Think before you speak - pauses are okay</li>
            <li>Structure your answers using the STAR method when appropriate</li>
            <li>Don't worry about filler words - they're tracked for improvement</li>
            <li>You can end the session anytime</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
