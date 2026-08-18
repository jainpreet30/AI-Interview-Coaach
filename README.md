# AI Interview Coach

AI Interview Coach is a final-year MERN project designed to provide students and early-career professionals with an AI-powered interview practice platform. It combines a modern React frontend, Express.js backend, MongoDB persistence, and AI-driven feedback with real-time voice capabilities.

## Technology Stack

### 🎨 Frontend
- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.0
- **Routing**: React Router DOM 6.14.2
- **HTTP Client**: Axios 1.5.0
- **Real-time Communication**: Socket.io Client 4.7.2
- **Testing**: Vitest 4.1.10, React Testing Library 14.0.0
- **Linting**: ESLint 8.57.0, ESLint React Plugin

### 🔧 Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18.3
- **Real-time**: Socket.io 4.7.2, Socket.io JWT 1.1.1
- **Database**: MongoDB 7.5.0, Mongoose 7.8.0
- **Authentication**: JWT (jsonwebtoken 9.0.1)
- **Security**: bcryptjs 2.4.3, CORS 2.8.5
- **Environment**: dotenv 16.4.1
- **Testing**: Jest 29.7.0, Supertest 7.2.2
- **Code Quality**: ESLint 8.57.0

### 🤖 AI & Machine Learning
- **AI Provider**: OpenAI API 4.9.0
- **Models Used**:
  - GPT-4 / GPT-3.5-turbo: Question generation & coaching feedback
  - Whisper: Audio transcription (speech-to-text)
  - TTS-1: Text-to-speech for coach responses

### 🗄️ Database
- **Primary**: MongoDB 7.5.0
  - Document-based NoSQL database
  - Atlas for production cloud hosting
  - Mongoose 7.8.0 for ORM/schema management
- **Collections**:
  - Users (authentication & profiles)
  - Questions (question bank)
  - InterviewSession (text-based practice sessions)
  - LiveSession (voice-based live interviews)
  - FeedbackReport (AI-generated feedback)
  - Analytics (user performance metrics)

### 📡 Real-time Communication
- **WebSocket**: Socket.io 4.7.2
  - Bi-directional real-time event communication
  - JWT authentication for socket connections
  - Event-based architecture for live interviews
  - Automatic reconnection handling

### 🔐 Security & Authentication
- **JWT**: jsonwebtoken 9.0.1
  - Token-based authentication
  - 7-day expiration (configurable)
  - Secure credential management
- **Password Hashing**: bcryptjs 2.4.3
  - Salted password hashing
  - OWASP compliance
- **CORS**: Cross-Origin Resource Sharing
  - Configurable allowed origins
  - Prevent unauthorized cross-site requests

### 🛠️ Development Tools
- **Package Manager**: npm
- **Dev Server**: Vite (frontend), Nodemon (backend)
- **Linting**: ESLint with React plugin
- **Testing**:
  - Jest (backend unit tests)
  - Vitest (frontend unit tests)
  - Supertest (API integration tests)
  - React Testing Library (component tests)
- **Build Tool**: Vite (frontend), Standard Node.js (backend)

### ☁️ Deployment & DevOps
- **Frontend Hosting**: Vercel, Netlify
- **Backend Hosting**: Render, Heroku, AWS, Railway
- **Database Hosting**: MongoDB Atlas
- **CI/CD**: GitHub Actions (recommended)
- **Containerization**: Docker support available

### 📊 Audio Processing
- **Client-side**: Web Audio API, MediaRecorder API
- **Server-side**: OpenAI Whisper (transcription), TTS (voice generation)
- **Audio Format**: WebM/MP3 compatible

### 📈 Monitoring & Analytics
- **Performance**: Real-time speech metrics tracking
- **User Analytics**: Session history, progress tracking
- **Error Handling**: Comprehensive error logging

## What is included
- Professional project documentation in the `docs/` folder
- Requirements, architecture, database design, API specification, and deployment plan
- A proposed MERN folder structure for clean development
- A 15-day roadmap tailored for GTU final year project delivery
- Live AI Interview feature with voice support and real-time metrics
- Comprehensive API documentation and WebSocket event specifications

## Next Steps
1. Review the documentation in `docs/` to understand project scope and architecture.
2. Configure backend environment variables in `server/.env`:
   - `MONGODB_URI` for MongoDB Atlas or local MongoDB.
   - `AI_API_KEY` for OpenAI, plus optional `AI_MODEL`.
3. Run the server and client locally:
   - Backend: `cd server && npm install && npm run dev`
   - Frontend: `cd client && npm install && npm run dev`
   - Run backend tests with `cd server && npm test` and frontend tests with `cd client && npm test`
   - For production deployment, set `VITE_API_URL=https://<your-backend>/api/v1` in the frontend environment so deployed Vercel builds call the backend URL.
4. Seed the database with sample data:
   - `cd server && npm run seed`
5. Validate the interview workflow by creating a new practice session and answering questions.
6. Add automated tests and CI for both backend and frontend.
7. Deploy the backend, frontend, and MongoDB to a cloud environment.

## Project status
- Backend: Express API, MongoDB models, authentication, and AI evaluation support implemented.
- Frontend: React + Vite interview workflow, protected routes, and AI feedback UI completed.
- AI integration: OpenAI support plus a local fallback generator for question creation and answer evaluation.
- Seed data: `server/seed/seed.cjs` and `server/seed/README.md` are available for rapid local setup.

## Recommended next steps
- Verify your MongoDB Atlas network access and `MONGODB_URI` connection:
  - In Atlas, open Network Access and add your current IP address or `0.0.0.0/0` for temporary testing.
  - Confirm your Atlas cluster user exists and has permissions for the `interview-coach` database.
  - Use the Atlas connection string wizard to get a working `mongodb+srv://` or `mongodb://` URI and save it in `server/.env`.
- Use `npm run seed` in `server/` to populate the database with sample questions and a demo admin account.
- Add automated tests:
  - Backend: Jest + Supertest for routes and controllers.
  - Frontend: React Testing Library for pages and components.
- Add GitHub Actions to run linting and tests on every push.
- Deploy the backend to a service like Render, Heroku, or Railway and the frontend to Vercel or Netlify.
- For Vercel frontend deployment, set `VITE_API_URL=https://<your-backend>/api/v1` in Vercel Environment Variables so the deployed client calls the backend correctly.
- Keep secrets out of source control and manage them through environment variables in deployment.

## Running the project locally
- Backend:
  1. `cd server`
  2. `npm install`
  3. copy `.env.example` to `.env` and update the values
  4. `npm run dev`
- Frontend:
  1. `cd client`
  2. `npm install`
  3. `npm run dev`

The client proxies API requests to `http://localhost:5000` while developing.

## Environment Configuration

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/interview-coach

# AI/API
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4

# Authentication
JWT_SECRET=your-jwt-secret-key

# Client URL (for CORS & WebSocket)
CLIENT_URL=http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:5000
```

## Features

### ✅ Core Features
- **Text-based Mock Interviews**: Practice with pre-recorded questions
- **Live Voice Interviews**: Real-time AI coaching with voice interaction
- **Real-time Transcription**: Automatic speech-to-text using OpenAI Whisper
- **AI-powered Feedback**: GPT-4 based intelligent coaching and suggestions
- **Performance Metrics**: Track WPM, confidence score, filler words, and more
- **Progress Analytics**: Dashboard with skill breakdown and readiness score
- **Interview Recording**: Complete session history and transcript storage
- **Multiple Interviewer Personas**: FAANG Lead, Startup CTO, Mentor, Strict, Friendly

### 🎯 Interview Categories
- Data Structures
- Algorithms
- System Design
- Behavioral Questions
- General Technical

### 📊 Performance Tracking
- Interview readiness score
- Skill mastery breakdown (technical depth, communication, problem-solving, STAR compliance)
- Practice streak tracking
- Daily activity heatmap
- Average performance metrics

## Project Structure

```
ai-interview-coach/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/             # Reusable React components
│   │   ├── pages/                  # Page components
│   │   ├── hooks/                  # Custom React hooks (useLiveInterview)
│   │   ├── services/               # API service layer (axios)
│   │   ├── contexts/               # React context (AuthContext)
│   │   ├── App.jsx                 # Main app routing
│   │   └── styles.css              # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                          # Express.js backend
│   ├── src/
│   │   ├── controllers/            # Route controllers
│   │   ├── models/                 # Mongoose schemas
│   │   ├── routes/                 # Express routes
│   │   ├── middleware/             # Custom middleware
│   │   ├── services/               # Business logic & AI services
│   │   ├── websocket/              # Socket.io handlers
│   │   ├── app.js                  # Express app setup
│   │   └── index.js                # Server entry point
│   ├── seed/                        # Database seeding scripts
│   ├── package.json
│   └── jest.config.cjs
│
├── docs/                            # Project documentation
│   ├── 01_PROJECT_SPEC.md
│   ├── 02_REQUIREMENTS.md
│   ├── 06_ARCHITECTURE.md
│   ├── 08_API.md
│   ├── 09_AI_PROMPTS.md
│   └── ... (more documentation)
│
├── live-ai.md                       # Live Interview feature documentation
├── LIVE_INTERVIEW_GUIDE.md          # Implementation guide
└── README.md                        # This file
```

## Key Technologies Deep Dive

### Socket.io for Real-time Communication
The Live Interview feature uses Socket.io for WebSocket-based real-time communication:

```javascript
// Backend: Setup Socket.io with JWT authentication
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
  auth: { token: JWT }
});

// Real-time events:
// - start-session: Initialize interview
// - audio-chunk: Stream audio data
// - submit-answer: Send completed answer for evaluation
// - end-session: Finish interview and save metrics
```

### OpenAI Integration
- **Whisper API**: Transcribes audio to text in real-time
- **GPT-4**: Generates intelligent coaching feedback and follow-up questions
- **TTS-1**: Converts coach responses to speech

### Mongoose Schema Design
Efficient MongoDB schema for high-performance queries:
- User model: Authentication & profiles
- LiveSession model: Voice interview data with transcripts
- InterviewSession model: Text-based practice data
- Analytics model: Performance tracking and metrics

## Testing

### Backend Testing
```bash
cd server
npm test                    # Run all tests with Jest
npm run lint               # Run ESLint
```

### Frontend Testing
```bash
cd client
npm test                   # Run tests with Vitest
npm run lint              # Run ESLint
```

## Deployment

### Frontend Deployment (Vercel)
```bash
# Set environment variables in Vercel:
VITE_API_URL=https://your-backend-url/api/v1
```

### Backend Deployment (Render/Heroku)
```bash
# Environment variables:
MONGODB_URI=<Atlas connection>
AI_API_KEY=<OpenAI key>
CLIENT_URL=https://your-frontend-url
JWT_SECRET=<Your secret>
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh token

### Text-based Interviews
- `POST /api/v1/sessions` - Create session
- `GET /api/v1/sessions/:id` - Get session
- `PUT /api/v1/sessions/:id/answer` - Submit answer
- `GET /api/v1/sessions` - List sessions

### Live Interviews
- `POST /api/v1/live-sessions` - Create live session
- `GET /api/v1/live-sessions/:id` - Get live session
- `PUT /api/v1/live-sessions/:id/complete` - Complete session
- `DELETE /api/v1/live-sessions/:id` - Delete session

### WebSocket Events (Live Interviews)
See `live-ai.md` for complete WebSocket event specification

## Browser Support
- Chrome/Edge 60+
- Firefox 55+
- Safari 14.1+
- Requires: Web Audio API, MediaRecorder API, WebSockets

## Performance Optimization

### Frontend
- Code splitting with React Router
- Lazy component loading
- Optimized re-renders with React hooks
- Web Audio API for efficient audio processing

### Backend
- Connection pooling for database
- Efficient WebSocket message handling
- Real-time metric calculations
- Caching frequently accessed data

## Security Features
- JWT-based authentication (7-day expiration)
- bcryptjs password hashing (OWASP compliant)
- CORS protection
- Environment variable secrets management
- WebSocket JWT authentication

## Troubleshooting

### MongoDB Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB Atlas network access settings
- Ensure IP whitelist includes your address

### OpenAI API Issues
- Confirm `AI_API_KEY` is valid
- Check API quota and billing
- Verify model access (GPT-4, Whisper, TTS-1)

### WebSocket Connection Issues
- Ensure `CLIENT_URL` matches frontend URL
- Check browser console for errors
- Verify microphone permissions

## Documentation
- **Full Documentation**: See `docs/` folder
- **Live Interview Guide**: See `LIVE_INTERVIEW_GUIDE.md`
- **Live Interview API**: See `live-ai.md`
- **Project Spec**: See `docs/01_PROJECT_SPEC.md`
- **Architecture**: See `docs/06_ARCHITECTURE.md`

## Contributing
1. Create a feature branch
2. Make your changes
3. Run tests: `npm test`
4. Run linter: `npm run lint`
5. Submit a pull request

## License
This project is for educational purposes (GTU Final Year Project)

---

**Current Version**: 0.1.0  
**Last Updated**: 2026-08-18  
**Status**: Feature Complete (Live Interview + Core Interviews)
