import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="saas-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-spark">✨</span> AI-Powered Interview Preparation
          </div>
          <h1>
            Practice interviews.<br />
            Get AI feedback.<br />
            <span className="gradient-text">Land your next opportunity.</span>
          </h1>
          <p className="hero-subtext">
            Simulate real technical and behavioral interviews, receive instant structured AI evaluations, and master the skills required to get hired.
          </p>

          <div className="hero-cta-buttons">
            {isAuthenticated ? (
              <>
                <Link className="button button-primary button-lg" to="/practice/start">
                  Start Mock Interview →
                </Link>
                <Link className="button button-secondary button-lg" to="/dashboard">
                  Go to Dashboard →
                </Link>
              </>
            ) : (
              <>
                <Link className="button button-primary button-lg" to="/register">
                  Register Free →
                </Link>
                <Link className="button button-secondary button-lg" to="/login">
                  Login
                </Link>
              </>
            )}
          </div>

          <div className="hero-social-proof">
            <span className="proof-tag">✓ Voice STT Answering</span>
            <span className="proof-tag">✓ STAR Method Scoring</span>
            <span className="proof-tag">✓ Real-time Speech Analytics</span>
          </div>
        </div>

        {/* Hero Interactive AI Visual Card */}
        <div className="hero-visual-card">
          <div className="visual-card-header">
            <div className="card-header-left">
              <span className="card-dot red"></span>
              <span className="card-dot yellow"></span>
              <span className="card-dot green"></span>
              <span className="card-title">AI Interview Evaluation</span>
            </div>
            <span className="card-status-live">LIVE ANALYTICS</span>
          </div>

          <div className="visual-card-body">
            <div className="score-ring-wrapper">
              <div className="score-circle">
                <span className="score-num">82</span>
                <span className="score-max">/ 100</span>
              </div>
              <div className="score-summary">
                <h4>Strong Performance</h4>
                <p>Data Structures & System Design</p>
              </div>
            </div>

            <div className="visual-metrics-grid">
              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>Technical Depth</span>
                  <strong>86%</strong>
                </div>
                <div className="metric-track"><div className="metric-fill" style={{ width: '86%' }}></div></div>
              </div>

              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>Communication Clarity</span>
                  <strong>79%</strong>
                </div>
                <div className="metric-track"><div className="metric-fill" style={{ width: '79%' }}></div></div>
              </div>

              <div className="metric-bar-item">
                <div className="metric-bar-label">
                  <span>STAR Compliance</span>
                  <strong>82%</strong>
                </div>
                <div className="metric-track"><div className="metric-fill" style={{ width: '82%' }}></div></div>
              </div>
            </div>

            <div className="visual-card-notes">
              <div className="note-pill positive">
                <span>✅ Strong explanation of array vs linked list trade-offs</span>
              </div>
              <div className="note-pill improvement">
                <span>💡 Focus on explaining time complexity & memory trade-offs</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="section-block landing-section">
        <div className="section-header-center">
          <span className="eyebrow">Seamless Flow</span>
          <h2>How AI Interview Coach Works</h2>
          <p>Four simple steps to transform your interview confidence and technical articulation.</p>
        </div>

        <div className="steps-grid">
          <div className="step-card">
            <span className="step-num">01</span>
            <h3>Choose Your Interview</h3>
            <p>Select target role, domain category (DSA, DBMS, System Design, Behavioral), and difficulty level.</p>
          </div>

          <div className="step-card">
            <span className="step-num">02</span>
            <h3>Answer via Voice or Text</h3>
            <p>Speak naturally using built-in speech recognition (STT) or type your detailed technical answers.</p>
          </div>

          <div className="step-card">
            <span className="step-num">03</span>
            <h3>Get Instant AI Evaluation</h3>
            <p>Our AI evaluates technical depth, STAR structure, speech pacing (WPM), and filler word frequency.</p>
          </div>

          <div className="step-card">
            <span className="step-num">04</span>
            <h3>Improve & Master Skills</h3>
            <p>Review strengths, missing concepts, rewritten ideal answers, and recommended next practice topics.</p>
          </div>
        </div>
      </section>

      {/* Feature Showcase Section */}
      <section id="features" className="section-block landing-section alt-bg">
        <div className="section-header-center">
          <span className="eyebrow">Core Capabilities</span>
          <h2>Everything You Need to Ace Your Interviews</h2>
          <p>Built specifically for software engineers, CS students, and tech candidates.</p>
        </div>

        <div className="features-grid-saas">
          <div className="feature-card-saas">
            <div className="feature-icon">🎯</div>
            <h3>Personalized Role Practice</h3>
            <p>Practice with questions tailored to software engineering, frontend, backend, and data roles.</p>
          </div>

          <div className="feature-card-saas">
            <div className="feature-icon">🤖</div>
            <h3>Multi-Dimensional AI Evaluation</h3>
            <p>Detailed evaluation breaking down technical accuracy, communication clarity, and problem solving.</p>
          </div>

          <div className="feature-card-saas">
            <div className="feature-icon">🎤</div>
            <h3>Voice Answering & Speech Analytics</h3>
            <p>Speak naturally with real-time speech-to-text, WPM pacing calculations, and filler word warnings.</p>
          </div>

          <div className="feature-card-saas">
            <div className="feature-icon">⭐</div>
            <h3>STAR Framework Rubric</h3>
            <p>Evaluates Situation, Task, Action, and Result completeness for behavioral and technical questions.</p>
          </div>

          <div className="feature-card-saas">
            <div className="feature-icon">📊</div>
            <h3>GitHub-Style Activity Heatmap</h3>
            <p>Track your daily practice contribution calendar, active streaks, and historical score progression.</p>
          </div>

          <div className="feature-card-saas">
            <div className="feature-icon">💡</div>
            <h3>Smart Actionable Coaching</h3>
            <p>Get point-by-point answer criticism, key terminology checklists, and rewritten ideal responses.</p>
          </div>
        </div>
      </section>

      {/* Interview Categories Section */}
      <section className="section-block landing-section">
        <div className="section-header-center">
          <span className="eyebrow">Comprehensive Coverage</span>
          <h2>Practice for Every Type of Interview</h2>
          <p>Explore questions across fundamental computer science topics and behavioral scenarios.</p>
        </div>

        <div className="category-explorer-grid">
          <div className="category-card-item">
            <div className="cat-badge">Technical</div>
            <h3>Data Structures & Algorithms</h3>
            <p>Arrays, Linked Lists, Stacks, Queues, Binary Trees, Graphs, Sorting, and Dynamic Programming.</p>
            <Link className="cat-link" to="/practice/start">Practice DSA →</Link>
          </div>

          <div className="category-card-item">
            <div className="cat-badge">Technical</div>
            <h3>DBMS & Operating Systems</h3>
            <p>SQL queries, Normalization, Indexing, Transactions, Process Scheduling, Threads, and Deadlocks.</p>
            <Link className="cat-link" to="/practice/start">Practice Core CS →</Link>
          </div>

          <div className="category-card-item">
            <div className="cat-badge">Architecture</div>
            <h3>System Design</h3>
            <p>Scalability, Microservices, Caching, Load Balancing, Database Partitioning, and Message Queues.</p>
            <Link className="cat-link" to="/practice/start">Practice System Design →</Link>
          </div>

          <div className="category-card-item">
            <div className="cat-badge">Behavioral</div>
            <h3>Behavioral & HR (STAR)</h3>
            <p>Leadership scenarios, Team conflicts, Project ownership, Failures, and Career aspirations.</p>
            <Link className="cat-link" to="/practice/start">Practice Behavioral →</Link>
          </div>
        </div>
      </section>

      {/* Final Call to Action Banner */}
      <section className="landing-cta-banner">
        <div className="cta-banner-content">
          <h2>Ready to Ace Your Next Interview?</h2>
          <p>Join candidates practicing daily to build technical depth, improve speech confidence, and get hired.</p>
          <Link className="button button-primary button-xl" to={isAuthenticated ? '/practice/start' : '/register'}>
            {isAuthenticated ? 'Start Practice Session Now →' : 'Create Free Account & Practice →'}
          </Link>
        </div>
      </section>
    </div>
  );
}
