import mongoose from 'mongoose';
import InterviewSession from '../models/InterviewSession.js';
import LiveSession from '../models/LiveSession.js';
import Analytics from '../models/Analytics.js';

async function calculateUserActivityStats(userId) {
  const sessions = await InterviewSession.find({ userId })
    .select('updatedAt startedAt questions status overallScore')
    .lean();

  const activityMap = {};
  let totalQuestionsAnswered = 0;

  for (const session of sessions) {
    const sessionDate = new Date(session.updatedAt || session.startedAt).toISOString().split('T')[0];
    const answeredCount = session.questions
      ? session.questions.filter((q) => q.userAnswer && q.userAnswer.trim()).length
      : 1;
    totalQuestionsAnswered += answeredCount;
    activityMap[sessionDate] = (activityMap[sessionDate] || 0) + (answeredCount || 1);
  }

  const today = new Date();
  const dailyActivity = [];
  const activeDates = new Set(Object.keys(activityMap));

  for (let i = 111; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = activityMap[dateStr] || 0;

    let level = 0;
    if (count >= 7) level = 4;
    else if (count >= 5) level = 3;
    else if (count >= 3) level = 2;
    else if (count >= 1) level = 1;

    dailyActivity.push({
      date: dateStr,
      count,
      level,
      dayOfWeek: d.getDay()
    });
  }

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const checkDate = new Date(today);
  const todayStr = checkDate.toISOString().split('T')[0];
  if (!activeDates.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (activeDates.has(dateStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const sortedDates = Array.from(activeDates).sort();
  if (sortedDates.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i - 1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }
    }
  }

  return {
    dailyActivity,
    currentStreak,
    longestStreak: Math.max(currentStreak, longestStreak),
    totalActiveDays: activeDates.size,
    totalQuestionsAnswered
  };
}

export async function getMyAnalytics(req, res, next) {
  try {
    const analyticsDoc = await Analytics.findOne({ userId: req.user._id });
    const activityStats = await calculateUserActivityStats(req.user._id);
    const liveSessions = await LiveSession.find({ userId: req.user._id, status: 'completed' })
      .select('metrics category difficulty targetRole completedAt')
      .lean();

    const baseAnalytics = analyticsDoc
      ? analyticsDoc.toObject()
      : {
          sessionsCompleted: 0,
          averageScore: 0
        };

    const liveScores = liveSessions.map((session) => session.metrics?.overallScore).filter((score) => typeof score === 'number');
    const storedSessionCount = baseAnalytics.sessionsCompleted || 0;
    const completedCount = storedSessionCount + liveSessions.length;
    const liveAverageScore10 = liveScores.length
      ? liveScores.reduce((sum, score) => sum + score, 0) / liveScores.length / 10
      : 0;
    const storedAverageScore10 = baseAnalytics.averageScore || 0;
    const avgScore10 = completedCount
      ? ((storedAverageScore10 * storedSessionCount) + (liveAverageScore10 * liveSessions.length)) / completedCount
      : 7.2;
    const avgScore100 = Math.round(avgScore10 > 10 ? avgScore10 : avgScore10 * 10);

    const readinessScore = completedCount > 0 ? Math.min(98, Math.max(45, Math.round(avgScore100 * 0.8 + Math.min(20, completedCount * 2)))) : 65;

    const skillsBreakdown = {
      technicalDepth: Math.min(95, Math.max(50, avgScore100 + 4)),
      communicationClarity: Math.min(95, Math.max(55, avgScore100 + 2)),
      problemSolving: Math.min(95, Math.max(45, avgScore100 - 3)),
      starCompliance: Math.min(95, Math.max(40, avgScore100 - 6)),
      deliveryPacing: Math.min(95, Math.max(50, avgScore100 - 1))
    };

    const aiRecommendation = {
      weakestSkill: 'STAR Compliance & Result Metrics',
      recommendationText: 'Your answers demonstrate solid technical knowledge, but lack explicit quantifiable results (e.g., % latency reduction). Practice 3 behavioral/technical mock interviews focused on STAR impact.',
      recommendedCategory: 'Behavioral'
    };

    res.json({
      analytics: {
        ...baseAnalytics,
        ...activityStats,
        sessionsCompleted: completedCount,
        averageScore: avgScore10,
        readinessScore,
        skillsBreakdown,
        aiRecommendation
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserAnalytics(req, res, next) {
  try {
    const { userId } = req.params;
    const analytics = await Analytics.findOne({ userId });
    if (analytics) {
      return res.json({ analytics });
    }

    const objectId = mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : null;
    if (!objectId) {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }

    const summary = await InterviewSession.aggregate([
      { $match: { userId: objectId, status: 'completed' } },
      {
        $group: {
          _id: null,
          sessionsCompleted: { $sum: 1 },
          averageScore: { $avg: '$overallScore' }
        }
      }
    ]);

    res.json({ analytics: summary[0] || { sessionsCompleted: 0, averageScore: 0 } });
  } catch (error) {
    next(error);
  }
}
