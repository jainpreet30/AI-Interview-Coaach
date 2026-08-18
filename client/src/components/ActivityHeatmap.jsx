import { useMemo } from 'react';

const LEVEL_COLORS = {
  0: '#ebedf0',
  1: '#9be9a8',
  2: '#40c463',
  3: '#30a14e',
  4: '#216e39'
};

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ActivityHeatmap({ analytics }) {
  const {
    dailyActivity = [],
    currentStreak = 0,
    longestStreak = 0,
    totalActiveDays = 0,
    totalQuestionsAnswered = 0
  } = analytics || {};

  // Group 112 days into 16 weeks of 7 days
  const weeks = useMemo(() => {
    if (!dailyActivity.length) return [];
    const result = [];
    let currentWeek = [];

    dailyActivity.forEach((item, index) => {
      currentWeek.push(item);
      if (currentWeek.length === 7 || index === dailyActivity.length - 1) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    return result;
  }, [dailyActivity]);

  return (
    <div className="activity-heatmap-card">
      <div className="heatmap-header">
        <div>
          <h3>Practice Contribution Calendar</h3>
          <p>Track your daily mock interview activity over the last 16 weeks.</p>
        </div>
        <div className="streak-badges">
          <span className="streak-pill flame">
            🔥 {currentStreak} Day Streak
          </span>
          <span className="streak-pill trophy">
            🏆 Best: {longestStreak} Days
          </span>
          <span className="streak-pill active-days">
            📅 {totalActiveDays} Active Days
          </span>
        </div>
      </div>

      <div className="heatmap-container">
        <div className="day-labels">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        <div className="weeks-grid">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="heatmap-week">
              {week.map((day) => (
                <div
                  key={day.date}
                  className="heatmap-cell"
                  style={{ backgroundColor: LEVEL_COLORS[day.level] || LEVEL_COLORS[0] }}
                  title={`${day.date}: ${day.count} response${day.count === 1 ? '' : 's'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="heatmap-footer">
        <span className="footer-meta">Total Questions Practiced: <strong>{totalQuestionsAnswered}</strong></span>
        <div className="heatmap-legend">
          <span>Less</span>
          {Object.values(LEVEL_COLORS).map((color, idx) => (
            <span key={idx} className="legend-cell" style={{ backgroundColor: color }} />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
