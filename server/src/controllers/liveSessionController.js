import LiveSession from '../models/LiveSession.js';
import { generateCoachingIntroduction } from '../services/liveAiService.js';

export async function createLiveSession(req, res, next) {
  try {
    const {
      category = 'General',
      difficulty = 'medium',
      targetRole = 'Software Engineer',
      interviewerPersona = 'faang-lead',
      resumeText = '',
      jobDescription = ''
    } = req.body;

    // Validate inputs
    if (!['Data Structures', 'Algorithms', 'System Design', 'Behavioral', 'General'].includes(category)) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return res.status(400).json({ message: 'Invalid difficulty' });
    }

    // Generate opening from AI coach
    const coachOpening = await generateCoachingIntroduction({
      category,
      difficulty,
      targetRole,
      interviewerPersona,
      resumeText,
      jobDescription
    });

    // Create live session
    const session = await LiveSession.create({
      userId: req.user._id,
      category,
      difficulty,
      targetRole,
      interviewerPersona,
      resumeText,
      jobDescription,
      status: 'waiting',
      transcript: [
        {
          speaker: 'coach',
          text: coachOpening.introduction,
          timestamp: new Date()
        }
      ],
      currentQuestion: {
        prompt: coachOpening.firstQuestion
      }
    });

    res.status(201).json({
      session: {
        _id: session._id,
        category: session.category,
        difficulty: session.difficulty,
        targetRole: session.targetRole,
        interviewerPersona: session.interviewerPersona,
        status: session.status,
        coachIntroduction: coachOpening.introduction,
        firstQuestion: coachOpening.firstQuestion
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getLiveSession(req, res, next) {
  try {
    const { id } = req.params;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function listLiveSessions(req, res, next) {
  try {
    const query = { userId: req.user._id };
    const { status } = req.query;

    if (status) {
      query.status = status;
    }

    const sessions = await LiveSession.find(query).sort({ createdAt: -1 }).limit(20);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function completeLiveSession(req, res, next) {
  try {
    const { id } = req.params;
    const { sessionNotes = '' } = req.body;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate session metrics
    const candidateTranscripts = session.transcript.filter(t => t.speaker === 'candidate');
    let totalSpeakingTime = 0;
    let totalWPM = 0;
    let totalFillerWords = 0;
    let totalConfidence = 0;

    candidateTranscripts.forEach(t => {
      if (t.speechMetrics) {
        totalSpeakingTime += t.speechMetrics.speakingDurationSeconds || 0;
        totalWPM += t.speechMetrics.wpm || 0;
        totalFillerWords += t.speechMetrics.fillerWordCount || 0;
        totalConfidence += t.speechMetrics.confidenceScore || 0;
      }
    });

    const candidateCount = candidateTranscripts.length || 1;

    session.status = 'completed';
    session.completedAt = new Date();
    session.duration = Math.round((session.completedAt - session.startedAt) / 1000); // in seconds
    session.sessionNotes = sessionNotes;
    session.metrics = {
      totalSpeakingTime,
      averageWPM: Math.round(totalWPM / candidateCount),
      fillerWordCount: totalFillerWords,
      confidenceScore: Math.round(totalConfidence / candidateCount),
      communicationScore: Math.round((100 - (totalFillerWords / candidateCount) * 5) * 0.8),
      overallScore: Math.round(totalConfidence / candidateCount)
    };

    await session.save();

    res.json({
      message: 'Session completed',
      session
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteLiveSession(req, res, next) {
  try {
    const { id } = req.params;

    const session = await LiveSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    if (!session.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    await LiveSession.findByIdAndDelete(id);

    res.json({ message: 'Session deleted' });
  } catch (error) {
    next(error);
  }
}
