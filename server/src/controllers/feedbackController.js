import FeedbackReport from '../models/FeedbackReport.js';
import InterviewSession from '../models/InterviewSession.js';

export async function getFeedbackBySession(req, res, next) {
  try {
    const { sessionId } = req.params;
    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (!session.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const feedback = await FeedbackReport.findOne({ sessionId });
    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not available for this session.' });
    }

    res.json({ feedback });
  } catch (error) {
    next(error);
  }
}
