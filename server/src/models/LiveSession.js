import mongoose from 'mongoose';

const liveSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['Data Structures', 'Algorithms', 'System Design', 'Behavioral', 'General']
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['easy', 'medium', 'hard']
    },
    targetRole: {
      type: String,
      default: 'Software Engineer'
    },
    interviewerPersona: {
      type: String,
      default: 'faang-lead',
      enum: ['faang-lead', 'startup', 'mentor', 'strict', 'friendly']
    },
    status: {
      type: String,
      default: 'waiting',
      enum: ['waiting', 'in-progress', 'completed', 'abandoned']
    },
    transcript: [
      {
        speaker: {
          type: String,
          enum: ['coach', 'candidate'],
          required: true
        },
        text: String,
        audioUrl: String,
        timestamp: {
          type: Date,
          default: Date.now
        },
        speechMetrics: {
          wpm: Number,
          confidence: Number,
          fillerWordCount: Number,
          fillerWordsFound: [String],
          speakingDurationSeconds: Number,
          pauseDurationSeconds: Number
        }
      }
    ],
    currentQuestion: {
      prompt: String,
      coachResponse: String,
      followUpQuestions: [String],
      score: Number,
      feedback: String
    },
    metrics: {
      totalSpeakingTime: Number,
      averageWPM: Number,
      fillerWordCount: Number,
      confidenceScore: Number,
      clarityScore: Number,
      technicalScore: Number,
      communicationScore: Number,
      overallScore: Number
    },
    recordingUrl: String,
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: Date,
    duration: Number,
    sessionNotes: String,
    resumeText: String,
    jobDescription: String,
    tags: [String]
  },
  { timestamps: true }
);

// Index for quick lookups
liveSessionSchema.index({ userId: 1, createdAt: -1 });
liveSessionSchema.index({ status: 1, userId: 1 });

const LiveSession = mongoose.model('LiveSession', liveSessionSchema);

export default LiveSession;
