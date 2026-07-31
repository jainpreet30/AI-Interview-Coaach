import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    difficulty: { type: String, required: true, enum: ['easy', 'medium', 'hard'] },
    prompt: { type: String, required: true },
    sampleAnswer: { type: String, default: '' },
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

questionSchema.index({ category: 1, difficulty: 1 });

export default mongoose.model('Question', questionSchema);
