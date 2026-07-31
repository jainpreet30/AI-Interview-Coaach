import InterviewSession from '../models/InterviewSession.js';
import Question from '../models/Question.js';
import FeedbackReport from '../models/FeedbackReport.js';
import Analytics from '../models/Analytics.js';
import { evaluateAnswer, generateInterviewQuestions, summarizeSession } from '../services/aiService.js';

export async function createSession(req, res, next) {
  try {
    const { category, difficulty, questionCount = 5, tags = [] } = req.body;
    if (!category || !difficulty) {
      return res.status(400).json({ message: 'Category and difficulty are required.' });
    }

    const difficultyAliasMap = {
      easy: 'easy',
      medium: 'medium',
      hard: 'hard',
      high: 'hard'
    };
    const categoryAliasMap = {
      'data structure': 'Data Structures',
      'data structures': 'Data Structures',
      algorithm: 'Algorithms',
      algorithms: 'Algorithms',
      'system design': 'System Design',
      behavioral: 'Behavioral'
    };

    const normalizedDifficulty = difficultyAliasMap[difficulty.toLowerCase()] || difficulty.toLowerCase();
    const normalizedCategory = categoryAliasMap[category.toLowerCase()] || category;
    const categoryQuery = new RegExp(`^${normalizedCategory}$`, 'i');
    const difficultyQuery = new RegExp(`^${normalizedDifficulty}$`, 'i');
    const questionCountNumber = Number(questionCount);

    const dbQuestions = await Question.find({ category: categoryQuery, difficulty: difficultyQuery })
      .limit(questionCountNumber * 2)
      .lean();

    const seenPrompts = new Set();
    const uniqueDbQuestions = [];
    for (const question of dbQuestions) {
      const promptKey = question.prompt.trim();
      if (!seenPrompts.has(promptKey)) {
        seenPrompts.add(promptKey);
        uniqueDbQuestions.push(question);
      }
      if (uniqueDbQuestions.length >= questionCountNumber) {
        break;
      }
    }

    let questions = uniqueDbQuestions;

    if (questions.length < questionCountNumber) {
      const missingCount = questionCountNumber - questions.length;
      const generated = await generateInterviewQuestions({ category: normalizedCategory, difficulty: normalizedDifficulty, questionCount: missingCount });
      for (const generatedQuestion of generated) {
        const promptKey = generatedQuestion.prompt.trim();
        if (!seenPrompts.has(promptKey)) {
          seenPrompts.add(promptKey);
          questions.push({
            prompt: generatedQuestion.prompt,
            sampleAnswer: generatedQuestion.sampleAnswer,
            tags: generatedQuestion.tags
          });
        }
      }

      // If generated fallback still had duplicates, fill any remaining questions with safe generic prompts.
      while (questions.length < questionCountNumber) {
        const prompt = `Provide another ${normalizedDifficulty} ${normalizedCategory} interview question and explain why it matters.`;
        questions.push({
          prompt,
          sampleAnswer: `A good answer explains the concept clearly, offers an example, and shows how it is used in real systems.`,
          tags: [normalizedCategory.toLowerCase(), normalizedDifficulty]
        });
      }
    }

    const sessionQuestions = questions.map((question) => ({
      questionId: question._id,
      prompt: question.prompt,
      sampleAnswer: question.sampleAnswer,
      userAnswer: '',
      aiFeedback: '',
      score: 0
    }));

    const session = await InterviewSession.create({
      userId: req.user._id,
      category,
      difficulty,
      questions: sessionQuestions,
      tags: Array.isArray(tags) ? tags : [],
      status: 'in-progress'
    });

    res.status(201).json({ session });
  } catch (error) {
    next(error);
  }
}

export async function getSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findById(id).populate('questions.questionId', 'category difficulty');
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }

    if (req.user.role !== 'admin' && !session.userId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this session.' });
    }

    res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function listSessions(req, res, next) {
  try {
    const query = {};
    if (req.user.role !== 'admin') {
      query.userId = req.user._id;
    }

    const sessions = await InterviewSession.find(query).sort({ startedAt: -1 }).limit(50);
    res.json({ sessions });
  } catch (error) {
    next(error);
  }
}

export async function submitAnswer(req, res, next) {
  try {
    const { id } = req.params;
    const { questionId, questionItemId, userAnswer } = req.body;
    if ((!questionId && !questionItemId) || typeof userAnswer !== 'string') {
      return res.status(400).json({ message: 'Question identifier and answer are required.' });
    }

    const session = await InterviewSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (!session.userId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Access denied to this session.' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Cannot answer questions for a completed session.' });
    }

    const questionItem = session.questions.find((item) => {
      if (questionItemId && item._id?.toString() === questionItemId) {
        return true;
      }
      return questionId && item.questionId?.toString() === questionId;
    });
    if (!questionItem) {
      return res.status(404).json({ message: 'Question in the session not found.' });
    }

    const aiResponse = await evaluateAnswer({ questionText: questionItem.prompt, userAnswer });
    questionItem.userAnswer = userAnswer;
    questionItem.aiFeedback = `Score: ${aiResponse.score}\nStrengths: ${aiResponse.strengths}\nImprovement: ${aiResponse.improvements}`;
    questionItem.score = aiResponse.score;

    await session.save();
    res.json({ session });
  } catch (error) {
    next(error);
  }
}

export async function completeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await InterviewSession.findById(id);
    if (!session) {
      return res.status(404).json({ message: 'Session not found.' });
    }
    if (!session.userId.equals(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied to this session.' });
    }
    if (session.status === 'completed') {
      return res.status(400).json({ message: 'Session already completed.' });
    }

    session.status = 'completed';
    session.completedAt = new Date();
    session.overallScore = session.questions.length > 0
      ? session.questions.reduce((sum, item) => sum + (item.score || 0), 0) / session.questions.length
      : 0;

    await session.save();

    const summaryResult = await summarizeSession({ questions: session.questions });

    const feedback = await FeedbackReport.create({
      sessionId: session._id,
      userId: session.userId,
      summary: summaryResult.summary,
      strengths: 'The session was completed and answers were evaluated for structure, clarity, and relevance.',
      improvements: 'Continue practicing answers, provide examples, and keep the response focused on the question.',
      confidenceScore: summaryResult.confidenceScore
    });

    const aggregate = await InterviewSession.aggregate([
      { $match: { userId: session.userId, status: 'completed' } },
      {
        $group: {
          _id: null,
          sessionsCompleted: { $sum: 1 },
          averageScore: { $avg: '$overallScore' }
        }
      }
    ]);

    const performanceResult = await InterviewSession.aggregate([
      { $match: { userId: session.userId, status: 'completed' } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          averageScore: { $avg: '$overallScore' }
        }
      }
    ]);

    const categoryPerformance = performanceResult.reduce((acc, item) => {
      acc[item._id] = { count: item.count, averageScore: item.averageScore };
      return acc;
    }, {});

    await Analytics.findOneAndUpdate(
      { userId: session.userId },
      {
        userId: session.userId,
        sessionsCompleted: aggregate[0]?.sessionsCompleted ?? 0,
        averageScore: aggregate[0]?.averageScore ?? 0,
        categoryPerformance
      },
      { upsert: true, new: true }
    );

    res.json({ session, feedback });
  } catch (error) {
    next(error);
  }
}
