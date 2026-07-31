const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env from server/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in server/.env. Aborting.');
  process.exit(1);
}

async function connect() {
  return mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

// Minimal schemas for seeding (keeps this script independent of app model changes)
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  passwordHash: String,
  role: { type: String, default: 'user' },
  profile: Object,
  createdAt: { type: Date, default: Date.now },
});

const questionSchema = new mongoose.Schema({
  category: String,
  difficulty: String,
  prompt: String,
  sampleAnswer: String,
  tags: [String],
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('SeedUser', userSchema, 'users');
const Question = mongoose.model('SeedQuestion', questionSchema, 'questions');

async function hashPassword(plain) {
  const bcrypt = require('bcryptjs');
  const saltRounds = 10;
  return await bcrypt.hash(plain, saltRounds);
}

async function runSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await connect();
    console.log('Connected.');

    // Admin user
    const adminEmail = 'admin@example.com';
    const adminExists = await User.findOne({ email: adminEmail }).lean();
    if (adminExists) {
      console.log(`Admin user already exists (email=${adminEmail}, _id=${adminExists._id}). Skipping create.`);
    } else {
      const password = 'Passw0rd!';
      const passwordHash = await hashPassword(password);
      const admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        profile: { bio: 'Seed admin user for interview-coach', skills: ['javascript','react','node'] },
      });
      console.log(`Created admin user: ${admin._id} (email=${adminEmail}, password='${password}')`);
    }

    // Sample questions
    const sampleQuestions = [
      {
        category: 'Algorithms',
        difficulty: 'Medium',
        prompt: 'Explain the difference between quicksort and mergesort. When would you use each?',
        sampleAnswer: 'Quicksort is typically faster on average but has worse worst-case. Mergesort is stable and guaranteed O(n log n). Use mergesort when stability is needed or worst-case guarantees, quicksort for in-memory average-case performance.',
        tags: ['sorting','divide-and-conquer'],
      },
      {
        category: 'System Design',
        difficulty: 'Hard',
        prompt: 'Design a URL shortening service like bit.ly. Describe components, data model, and how to handle high read/write scale.',
        sampleAnswer: 'Key components: API, redirector service, datastore for mappings, analytics pipeline. Use base62 short codes, consistent hashing or central ID generator, caching for redirects, and eventual consistency for analytics.',
        tags: ['design','scalability'],
      },
      {
        category: 'JavaScript',
        difficulty: 'Easy',
        prompt: 'What is event loop in JavaScript and how do promises fit into it?',
        sampleAnswer: 'Event loop processes macrotasks and microtasks; promises callbacks are scheduled as microtasks which run after the current macrotask but before the next macrotask.',
        tags: ['javascript','runtime'],
      },
    ];

    // Insert only those that are not exact duplicates by prompt
    for (const q of sampleQuestions) {
      const existing = await Question.findOne({ prompt: q.prompt }).lean();
      if (existing) {
        console.log(`Question already exists, skipping: ${existing._id}`);
      } else {
        const created = await Question.create(q);
        console.log(`Inserted question ${created._id} - ${q.category} / ${q.difficulty}`);
      }
    }

    const qCount = await Question.countDocuments();
    const uCount = await User.countDocuments();
    console.log(`Seeding complete. Totals -> users: ${uCount}, questions: ${qCount}`);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exitCode = 2;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit();
  }
}

runSeed();
