import mongoose from 'mongoose';

const sessionQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    prompt: { type: String, required: true },
    sampleAnswer: { type: String, default: '' },
    userAnswer: { type: String, default: '' },
    aiFeedback: { type: String, default: '' },
    score: { type: Number, default: 0 },
    rubric: {
      technicalScore: { type: Number, default: 0 },
      communicationScore: { type: Number, default: 0 },
      starScore: {
        situation: { type: Number, default: 0 },
        task: { type: Number, default: 0 },
        action: { type: Number, default: 0 },
        result: { type: Number, default: 0 }
      },
      strengths: { type: String, default: '' },
      improvements: { type: String, default: '' },
      criticism: { type: String, default: '' },
      whatToAdd: [{ type: String }],
      keyTermsChecklist: [{
        term: { type: String },
        included: { type: Boolean, default: false }
      }],
      recommendedAddition: { type: String, default: '' },
      keyMissingPoints: [{ type: String }],
      idealAnswer: { type: String, default: '' }
    },
    speechMetrics: {
      wpm: { type: Number, default: 0 },
      fillerWordCount: { type: Number, default: 0 },
      fillerWordsFound: [{ type: String }],
      speakingDurationSeconds: { type: Number, default: 0 }
    }
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
