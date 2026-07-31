import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

const categories = ['Data Structures', 'Algorithms', 'System Design', 'Behavioral'];
const difficulties = ['easy', 'medium', 'hard'];

export default function PracticeStartPage() {
  const [category, setCategory] = useState(categories[0]);
  const [difficulty, setDifficulty] = useState('easy');
  const [count, setCount] = useState(5);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/sessions', { category, difficulty, questionCount: count });
      navigate(`/practice/${response.data.session._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="practice-page">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Practice setup</span>
          <h1>Choose your mock interview details</h1>
        </div>
      </div>

      <div className="practice-card">
        <form onSubmit={handleSubmit} className="practice-form">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Difficulty
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              {difficulties.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Question count
            <input
              type="number"
              min="1"
              max="10"
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
            />
          </label>

          {error && <p className="form-error">{error}</p>}
          <button className="button button-primary" type="submit" disabled={loading}>
            {loading ? 'Creating session…' : 'Start session'}
          </button>
        </form>
      </div>
    </section>
  );
}
