import mongoose from 'mongoose';

const sessionQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    prompt: { type: String, required: true },
    sampleAnswer: { type: String, default: '' },
    userAnswer: { type: String, default: '' },
    aiFeedback: { type: String, default: '' },
    score: { type: Number, default: 0 }
  }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    questions: [sessionQuestionSchema],
    overallScore: { type: Number, default: 0 },
    tags: [{ type: String }],
    notes: { type: String, default: '' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.model('InterviewSession', interviewSessionSchema);
