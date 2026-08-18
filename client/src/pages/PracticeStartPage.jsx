import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const ROLES = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Engineer',
  'Data Analyst',
  'System Architect'
];

const CATEGORIES = ['Data Structures', 'Algorithms', 'System Design', 'Behavioral'];

const PERSONAS = [
  { id: 'faang-lead', name: '🏢 FAANG Tech Lead', desc: 'Strict tone, deep architectural probing & edge case focus.' },
  { id: 'recruiter', name: '🤝 Supportive Recruiter', desc: 'Friendly tone, culture fit & STAR story structure focus.' },
  { id: 'startup-founder', name: '⚡ Startup Founder', desc: 'Fast-paced, ownership & rapid execution focus.' },
  { id: 'architect', name: '📐 System Architect', desc: 'Scalability, distributed systems, & trade-off focus.' }
];

const DIFFICULTIES = [
  { id: 'easy', label: '🌱 Easy', desc: 'Fundamentals & core concepts' },
  { id: 'medium', label: '⚡ Medium', desc: 'Standard interview level' },
  { id: 'hard', label: '🔥 Hard', desc: 'Advanced trade-offs & scale' }
];

export default function PracticeStartPage() {
  const [targetRole, setTargetRole] = useState(ROLES[0]);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [interviewerPersona, setInterviewerPersona] = useState('faang-lead');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/sessions', {
        category,
        difficulty,
        questionCount: count,
        targetRole,
        interviewerPersona,
        resumeText,
        jobDescription
      });
      navigate(`/practice/${response.data.session._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const estMinutes = Math.round(count * 2);

  return (
    <section className="practice-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Interactive Mock Setup</span>
          <h1>Set up your personalized AI interview</h1>
          <p>Customize your target role, interviewer persona, and optionally upload your resume or job description.</p>
        </div>
      </div>

      <div className="practice-card setup-card-expanded">
        <form onSubmit={handleSubmit} className="practice-form">
          {/* Target Role & Category */}
          <div className="form-row-2col">
            <label>
              Target Role
              <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </label>

            <label>
              Domain Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </label>
          </div>

          {/* Interviewer Persona Selection */}
          <div className="persona-selection-block">
            <label className="section-label">Select Interviewer Style / Persona</label>
            <div className="persona-grid">
              {PERSONAS.map((p) => (
                <div
                  key={p.id}
                  className={`persona-card-item ${interviewerPersona === p.id ? 'active' : ''}`}
                  onClick={() => setInterviewerPersona(p.id)}
                >
                  <strong className="persona-name">{p.name}</strong>
                  <p className="persona-desc">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Cards */}
          <div className="difficulty-selection-block">
            <label className="section-label">Select Difficulty</label>
            <div className="difficulty-cards-grid">
              {DIFFICULTIES.map((d) => (
                <div
                  key={d.id}
                  className={`diff-card-item ${difficulty === d.id ? 'active' : ''}`}
                  onClick={() => setDifficulty(d.id)}
                >
                  <strong className="diff-title">{d.label}</strong>
                  <span className="diff-desc">{d.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Question Count & Est Duration */}
          <div className="form-row-count-duration">
            <label>
              Number of Questions
              <div className="count-pill-selector">
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    className={`count-pill ${count === num ? 'active' : ''}`}
                    onClick={() => setCount(num)}
                  >
                    {num} Questions
                  </button>
                ))}
              </div>
            </label>

            <div className="duration-estimate-badge">
              ⏱ Estimated Duration: <strong>~{estMinutes} minutes</strong>
            </div>
          </div>

          {/* Optional Resume & JD Personalization */}
          <div className="personalization-accordion">
            <button
              type="button"
              className="button-toggle-personalization"
              onClick={() => setShowPersonalization(!showPersonalization)}
            >
              {showPersonalization ? '▼ Hide Resume / JD Personalization' : '▶ Add Resume & Job Description (Tailored AI Questions)'}
            </button>

            {showPersonalization && (
              <div className="personalization-fields">
                <label>
                  Paste Resume / Skills Summary
                  <textarea
                    rows="4"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your key projects, tech stack, and achievements..."
                  />
                </label>

                <label>
                  Paste Target Job Description (JD)
                  <textarea
                    rows="4"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the requirements from the job posting..."
                  />
                </label>
              </div>
            )}
          </div>

          {error && <p className="form-error">{error}</p>}

          <button className="button button-primary button-lg button-full" type="submit" disabled={loading}>
            {loading ? 'Generating AI Mock Interview…' : 'Start Mock Interview Session →'}
          </button>
        </form>
      </div>
    </section>
  );
}
