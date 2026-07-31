import mongoose from 'mongoose';
import InterviewSession from '../models/InterviewSession.js';
import Analytics from '../models/Analytics.js';

export async function getMyAnalytics(req, res, next) {
  try {
    const analytics = await Analytics.findOne({ userId: req.user._id });
    if (analytics) {
      return res.json({ analytics });
    }

    const summary = await InterviewSession.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
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
