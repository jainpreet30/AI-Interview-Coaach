import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['student', 'coach', 'admin'], default: 'student' },
    profile: {
      university: String,
      department: String,
      year: String,
      skills: [String]
    }
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
