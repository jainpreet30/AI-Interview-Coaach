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

// Extended schemas for sessions, feedback, analytics
const sessionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  startedAt: Date,
  endedAt: Date,
  questions: [
    {
      questionId: mongoose.Schema.Types.ObjectId,
      prompt: String,
      userAnswer: String,
      aiFeedback: Object,
      score: Number,
    },
  ],
  status: String,
  seedTag: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const feedbackSchema = new mongoose.Schema({
  sessionId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  overallScore: Number,
  areas: [Object],
  seedTag: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
});

const analyticsSchema = new mongoose.Schema({
  type: String,
  sessionId: mongoose.Schema.Types.ObjectId,
  userId: mongoose.Schema.Types.ObjectId,
  timestamp: { type: Date, default: Date.now },
  meta: Object,
  seedTag: { type: String, index: true },
});

const User = mongoose.model('SeedUser', userSchema, 'users');
const Question = mongoose.model('SeedQuestion', questionSchema, 'questions');
const Session = mongoose.model('SeedSession', sessionSchema, 'sessions');
const Feedback = mongoose.model('SeedFeedback', feedbackSchema, 'feedback_reports');
const Analytics = mongoose.model('SeedAnalytics', analyticsSchema, 'analytics');

async function hashPassword(plain) {
  try {
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    return await bcrypt.hash(plain, saltRounds);
  } catch (err) {
    console.warn('bcrypt not available (or failed). Storing plain passwordHash field with the plain text password. Install bcrypt for hashed passwords.');
    return plain;
  }
}

async function runSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await connect();
    console.log('Connected.');

    // Admin user
    const adminEmail = 'admin@example.com';
    let admin = await User.findOne({ email: adminEmail }).lean();
    if (admin) {
      console.log(`Admin user already exists (email=${adminEmail}, _id=${admin._id}).`);
      admin = await User.findOne({ email: adminEmail });
    } else {
      const password = 'Passw0rd!';
      const passwordHash = await hashPassword(password);
      admin = await User.create({
        name: 'Admin User',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        profile: { bio: 'Seed admin user for interview-coach', skills: ['javascript','react','node'] },
      });
      console.log(`Created admin user: ${admin._id} (email=${adminEmail}, password='${password}')`);
    }

    // Initial sample questions (keeps previous ones)
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

    // Additional 12 sample questions
    const moreQuestions = [
      { category: 'Algorithms', difficulty: 'Hard', prompt: 'Describe Dijkstra\'s algorithm and its time complexity.', sampleAnswer: 'Dijkstra finds shortest paths from source to all nodes in O(E log V) with a binary heap, uses non-negative weights.', tags: ['graphs','shortest-path'] },
      { category: 'Algorithms', difficulty: 'Medium', prompt: 'How does dynamic programming differ from divide and conquer?', sampleAnswer: 'DP stores overlapping subproblems to avoid recomputation; divide-and-conquer splits into independent subproblems.', tags: ['dp','techniques'] },
      { category: 'Databases', difficulty: 'Medium', prompt: 'What are database transactions and ACID properties?', sampleAnswer: 'ACID: Atomicity, Consistency, Isolation, Durability; transactions group operations to maintain data integrity.', tags: ['databases','transactions'] },
      { category: 'System Design', difficulty: 'Medium', prompt: 'How would you design a rate limiter for an API?', sampleAnswer: 'Use token bucket or leaky bucket algorithms, distributed counters in Redis, client throttling and burst handling.', tags: ['design','rate-limiting'] },
      { category: 'JavaScript', difficulty: 'Medium', prompt: 'Explain closures in JavaScript with an example.', sampleAnswer: 'Closures capture lexical environment; a function returned from another function can access its outer scope variables.', tags: ['javascript','closures'] },
      { category: 'React', difficulty: 'Easy', prompt: 'What is reconciliation in React?', sampleAnswer: 'Reconciliation is React\'s diffing algorithm to update the DOM efficiently using the virtual DOM.', tags: ['react','vdom'] },
      { category: 'Security', difficulty: 'Medium', prompt: 'What is XSS and how can it be prevented?', sampleAnswer: 'Cross-site scripting injects scripts; prevent with output encoding, CSP, input validation, and proper use of frameworks.', tags: ['security','xss'] },
      { category: 'DevOps', difficulty: 'Easy', prompt: 'What is CI/CD and why is it important?', sampleAnswer: 'CI/CD automates build/test/deploy pipeline improving reliability and speed of delivery.', tags: ['devops','ci-cd'] },
      { category: 'Data Structures', difficulty: 'Easy', prompt: 'Compare array and linked list. When to use each?', sampleAnswer: 'Arrays have O(1) index access; linked lists provide O(1) insert/delete with pointer updates. Use arrays for random access, lists for frequent insertions.', tags: ['data-structures'] },
      { category: 'Data Structures', difficulty: 'Easy', prompt: 'Describe how a stack is used in programming. Give one example scenario.', sampleAnswer: 'A stack stores items in last-in-first-out order. It is used in function call management, undo history, and parsing algorithms.', tags: ['data-structures','stack'] },
      { category: 'Data Structures', difficulty: 'Easy', prompt: 'What is a queue and how does it differ from a stack?', sampleAnswer: 'A queue is first-in-first-out, while a stack is last-in-first-out. Use queues for task scheduling and stacks for nested execution.', tags: ['data-structures','queue'] },
      { category: 'Data Structures', difficulty: 'Easy', prompt: 'Explain the concept of a hash table and why it is useful.', sampleAnswer: 'A hash table maps keys to values using a hash function for near-constant lookups, making it useful for dictionaries and caches.', tags: ['data-structures','hash-table'] },
      { category: 'Python', difficulty: 'Medium', prompt: 'What are list comprehensions and generators in Python?', sampleAnswer: 'List comprehensions return lists; generators yield values lazily with less memory footprint.', tags: ['python'] },
      { category: 'Algorithms', difficulty: 'Hard', prompt: 'Explain dynamic programming approach to the knapsack problem.', sampleAnswer: 'Use DP table filling for capacities to achieve O(nW) time; choose between 0/1 and fractional variants.', tags: ['dp','knapsack'] },
      { category: 'Web', difficulty: 'Medium', prompt: 'Explain CORS and how browsers enforce it.', sampleAnswer: 'CORS is a browser security feature using headers (Access-Control-Allow-Origin) to permit cross-origin requests.', tags: ['web','cors'] },
    ];

    for (const q of moreQuestions) {
      const existing = await Question.findOne({ prompt: q.prompt }).lean();
      if (existing) {
        console.log(`(more) Question already exists, skipping: ${existing._id}`);
      } else {
        const created = await Question.create(q);
        console.log(`(more) Inserted question ${created._id} - ${q.category} / ${q.difficulty}`);
      }
    }

    // Create two sample sessions (one completed, one in_progress) with seedTag for idempotency
    const completedTag = 'seed_completed_session_v1';
    const inProgressTag = 'seed_inprogress_session_v1';

    const completedExists = await Session.findOne({ seedTag: completedTag }).lean();
    const inProgressExists = await Session.findOne({ seedTag: inProgressTag }).lean();

    // Helper to pick questions for session
    const pickQuestionsByPrompts = async (prompts) => {
      const docs = [];
      for (const p of prompts) {
        let q = await Question.findOne({ prompt: p }).lean();
        if (!q) {
          q = await Question.findOne().lean();
        }
        if (q) docs.push(q);
      }
      return docs;
    };

    if (!completedExists) {
      const prompts = [
        'Explain the difference between quicksort and mergesort. When would you use each?',
        'What is event loop in JavaScript and how do promises fit into it?',
      ];
      const qs = await pickQuestionsByPrompts(prompts);
      const sessionDoc = {
        userId: admin._id,
        startedAt: new Date(Date.now() - 1000 * 60 * 60),
        endedAt: new Date(),
        questions: qs.map((q, i) => ({
          questionId: q._id,
          prompt: q.prompt,
          userAnswer: i === 0 ? 'Quicksort generally faster; mergesort stable' : 'Promises are microtasks',
          aiFeedback: { score: i === 0 ? 80 : 85, notes: 'Good, expand on complexity' },
          score: i === 0 ? 80 : 85,
        })),
        status: 'completed',
        seedTag: completedTag,
      };
      const created = await Session.create(sessionDoc);
      console.log(`Created completed session ${created._id}`);

      // Create feedback
      const feedbackDoc = {
        sessionId: created._id,
        userId: admin._id,
        overallScore: 82,
        areas: [
          { area: 'clarity', score: 85, notes: 'Clear structure' },
          { area: 'depth', score: 78, notes: 'Add complexity discussion' },
        ],
        seedTag: `${completedTag}_feedback`,
      };
      const fb = await Feedback.create(feedbackDoc);
      console.log(`Created feedback report ${fb._id} for session ${created._id}`);

      // Create analytics event
      const analyticsDoc = {
        type: 'session_completed',
        sessionId: created._id,
        userId: admin._id,
        meta: { durationSeconds: 3600, score: 82 },
        seedTag: `${completedTag}_analytics`,
      };
      const an = await Analytics.create(analyticsDoc);
      console.log(`Created analytics event ${an._id}`);
    } else {
      console.log(`Completed session already exists: ${completedExists._id}`);
    }

    if (!inProgressExists) {
      const prompts2 = [
        'Design a URL shortening service like bit.ly. Describe components, data model, and how to handle high read/write scale.',
        'How would you design a rate limiter for an API?',
      ];
      const qs2 = await pickQuestionsByPrompts(prompts2);
      const sessionDoc2 = {
        userId: admin._id,
        startedAt: new Date(),
        endedAt: null,
        questions: qs2.map((q) => ({
          questionId: q._id,
          prompt: q.prompt,
          userAnswer: null,
          aiFeedback: null,
          score: null,
        })),
        status: 'in_progress',
        seedTag: inProgressTag,
      };
      const created2 = await Session.create(sessionDoc2);
      console.log(`Created in_progress session ${created2._id}`);
    } else {
      console.log(`In-progress session already exists: ${inProgressExists._id}`);
    }

    const qCount = await Question.countDocuments();
    const uCount = await User.countDocuments();
    const sCount = await Session.countDocuments();
    const fCount = await Feedback.countDocuments();
    const aCount = await Analytics.countDocuments();

    console.log(`Seeding complete. Totals -> users: ${uCount}, questions: ${qCount}, sessions: ${sCount}, feedback_reports: ${fCount}, analytics: ${aCount}`);
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
