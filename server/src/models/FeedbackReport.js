import mongoose from 'mongoose';

const feedbackReportSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    summary: { type: String, default: '' },
    strengths: { type: String, default: '' },
    improvements: { type: String, default: '' },
    confidenceScore: { type: Number, default: 0 },
    generatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model('FeedbackReport', feedbackReportSchema);
