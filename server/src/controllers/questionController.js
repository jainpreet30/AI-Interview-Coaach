import Question from '../models/Question.js';

export async function listQuestions(req, res, next) {
  try {
    const { category, difficulty, search, limit = 20, page = 1 } = req.query;
    const query = {};

    if (category) {
      query.category = category;
    }
    if (difficulty) {
      query.difficulty = difficulty;
    }
    if (search) {
      query.prompt = new RegExp(search, 'i');
    }

    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    res.json({ questions });
  } catch (error) {
    next(error);
  }
}

export async function getQuestionById(req, res, next) {
  try {
    const { id } = req.params;
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.json({ question });
  } catch (error) {
    next(error);
  }
}

export async function createQuestion(req, res, next) {
  try {
    const { category, difficulty, prompt, sampleAnswer, tags } = req.body;
    if (!category || !difficulty || !prompt) {
      return res.status(400).json({ message: 'Category, difficulty, and prompt are required.' });
    }

    const question = await Question.create({
      category,
      difficulty,
      prompt,
      sampleAnswer: sampleAnswer || '',
      tags: Array.isArray(tags) ? tags : [],
      createdBy: req.user._id
    });
    res.status(201).json({ question });
  } catch (error) {
    next(error);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const question = await Question.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.json({ question });
  } catch (error) {
    next(error);
  }
}

export async function deleteQuestion(req, res, next) {
  try {
    const { id } = req.params;
    const question = await Question.findByIdAndDelete(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found.' });
    }
    res.json({ message: 'Question deleted successfully.' });
  } catch (error) {
    next(error);
  }
}
