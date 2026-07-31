import mongoose from 'mongoose';

const categoryPerformanceSchema = new mongoose.Schema(
  {
    count: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 }
  },
  { _id: false }
);

const analyticsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    sessionsCompleted: { type: Number, default: 0 },
    averageScore: { type: Number, default: 0 },
    categoryPerformance: { type: Map, of: categoryPerformanceSchema, default: {} }
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', analyticsSchema);
