# Live AI Interview Feature

## Overview
The Live AI Interview feature enables users to practice technical and behavioral interviews using voice interaction with an AI coach in real-time. The system provides instant feedback, metrics tracking, and performance analysis.

## Architecture

### Components

#### Backend
- **LiveSession Model**: Stores interview session data including transcript, metrics, and results
- **liveAiService.js**: Handles AI operations:
  - Audio transcription (OpenAI Whisper)
  - Text-to-speech conversion (OpenAI TTS)
  - Real-time coaching response generation
  - Speech metrics calculation
  - Filler word detection

- **liveSessionController.js**: REST API endpoints for session management
- **liveInterviewSocket.js**: WebSocket handlers for real-time communication

#### Frontend
- **LiveInterviewStartPage.jsx**: UI for configuring and starting a new live interview
- **LiveInterviewPage.jsx**: Main interview interface
- **useLiveInterview.js**: Custom hooks for:
  - WebSocket connection management
  - Audio recording and playback
  - Speech metrics calculation

### Real-time Communication Flow

```
Client                          WebSocket                  Server
  |                                |                         |
  |-- start-session ------------>  |                         |
  |                                |----> Load Session       |
  |                                |----> Generate Intro     |
  |  <----------- session-started  |                         |
  |                                |                         |
  |-- [User speaks & records] --->  |                         |
  |-- audio-chunk (streaming) >>>  | (optional buffering)   |
  |-- submit-answer ------------>  |                         |
  |                                |----> Transcribe Audio   |
  |                                |----> Calculate Metrics  |
  |  <-- transcription-complete    |----> Generate Feedback  |
  |                                |----> Generate TTS       |
  |  <-- coaching-response         |                         |
  |                                |                         |
  | [Display feedback & play audio]|                         |
  |                                |                         |
  |-- [Next question cycle] ----->  |                         |
  |                                |                         |
  |-- end-session ------------>  |                         |
  |                                |----> Calculate Metrics  |
  |  <------ session-ended         |----> Save Session      |
```

## Features

### 1. Real-time Transcription
- Audio from candidate is transcribed using OpenAI Whisper
- Transcription appears in real-time in the interface
- Supports continuous speech recognition

### 2. AI Coaching
- Dynamic question generation based on difficulty and category
- Real-time feedback on answers
- Follow-up questions for deeper evaluation
- Customizable interviewer personas:
  - **FAANG Lead**: Rigorous, technical interviewer
  - **Startup CTO**: Pragmatic, focused on solutions
  - **Mentor**: Supportive, educational approach
  - **Strict**: Demanding high standards
  - **Friendly**: Encouraging and approachable

### 3. Live Metrics
Tracked in real-time:
- **Words Per Minute (WPM)**: Speaking pace (ideal: 120-150)
- **Confidence Score**: Overall confidence metric (0-100)
- **Filler Word Count**: Number of detected filler words (um, uh, like, etc.)
- **Speaking Duration**: Total time spent speaking
- **Communication Score**: Based on clarity and filler words

### 4. Feedback System
For each answer, candidates receive:
- **Score** (1-10): Overall quality assessment
- **Strengths**: What went well
- **Areas for Improvement**: Specific recommendations
- **Suggested Follow-up**: Next question based on response

### 5. Interview Recording
- Complete transcript saved
- Audio clips can be replayed
- Session metrics stored for later review
- Historical data for tracking progress

## API Endpoints

### REST API

#### Create Live Session
```
POST /api/v1/live-sessions
Headers: Authorization: Bearer {token}
Body: {
  category: "Data Structures|Algorithms|System Design|Behavioral|General",
  difficulty: "easy|medium|hard",
  targetRole: "Software Engineer",
  interviewerPersona: "faang-lead|startup|mentor|strict|friendly",
  resumeText?: "Optional resume content",
  jobDescription?: "Optional JD"
}
Response: { session: { _id, category, difficulty, coachIntroduction, firstQuestion } }
```

#### Get Live Session
```
GET /api/v1/live-sessions/:id
Headers: Authorization: Bearer {token}
Response: { session: LiveSession }
```

#### List Live Sessions
```
GET /api/v1/live-sessions?status=in-progress|completed|waiting
Headers: Authorization: Bearer {token}
Response: { sessions: [LiveSession] }
```

#### Complete Live Session
```
PUT /api/v1/live-sessions/:id/complete
Headers: Authorization: Bearer {token}
Body: { sessionNotes: "Optional notes" }
Response: { session: LiveSession with metrics }
```

#### Delete Live Session
```
DELETE /api/v1/live-sessions/:id
Headers: Authorization: Bearer {token}
Response: { message: "Session deleted" }
```

### WebSocket Events

#### Client → Server

**start-session**
```json
{
  "sessionId": "string",
  "token": "string"
}
```

**audio-chunk**
```json
{
  "sessionId": "string",
  "audioData": "Uint8Array"
}
```

**submit-answer**
```json
{
  "sessionId": "string",
  "audioBuffer": "Uint8Array",
  "durationSeconds": "number"
}
```

**end-session**
```json
{
  "sessionId": "string"
}
```

#### Server → Client

**session-started**
```json
{
  "message": "Session started successfully",
  "currentQuestion": "string",
  "transcript": [{ speaker: "coach|candidate", text: "string", timestamp: "Date" }]
}
```

**transcription-complete**
```json
{
  "speaker": "candidate",
  "text": "string",
  "metrics": {
    "wpm": "number",
    "wordCount": "number",
    "durationSeconds": "number",
    "fillerWordCount": "number",
    "fillerWordsFound": ["string"],
    "confidenceScore": "number"
  }
}
```

**coaching-response**
```json
{
  "feedback": "string",
  "score": "number (1-10)",
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "nextResponse": "string",
  "audioUrl": "string (base64 audio)",
  "followUpQuestions": ["string"],
  "nextQuestion": "string"
}
```

**session-ended**
```json
{
  "message": "Session ended",
  "session": {
    "metrics": { ... },
    "duration": "number (seconds)",
    "transcript": [ ... ]
  }
}
```

## Database Schema

### LiveSession
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  category: String (enum),
  difficulty: String (enum),
  targetRole: String,
  interviewerPersona: String (enum),
  status: String (enum: waiting|in-progress|completed|abandoned),
  transcript: [{
    speaker: String (coach|candidate),
    text: String,
    audioUrl: String,
    timestamp: Date,
    speechMetrics: {
      wpm: Number,
      confidence: Number,
      fillerWordCount: Number,
      fillerWordsFound: [String],
      speakingDurationSeconds: Number
    }
  }],
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
  startedAt: Date,
  completedAt: Date,
  duration: Number,
  sessionNotes: String,
  resumeText: String,
  jobDescription: String,
  tags: [String],
  timestamps: { createdAt, updatedAt }
}
```

## Environment Variables

```env
# Backend
AI_API_KEY=<OpenAI API key>
AI_MODEL=gpt-4 (or gpt-3.5-turbo)
JWT_SECRET=<Your JWT secret>
CLIENT_URL=http://localhost:5173 (or production URL)
MONGODB_URI=<MongoDB connection string>

# Frontend (in .env or .env.local)
VITE_API_URL=http://localhost:5000
```

## Installation & Setup

### Backend
```bash
cd server
npm install
npm run dev
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## Usage Example

### Starting a Live Interview

1. User navigates to `/live-interview/start`
2. Selects interview category, difficulty, target role, and persona
3. Clicks "Start Live Interview"
4. System creates a LiveSession and establishes WebSocket connection
5. AI coach provides introduction and first question
6. User clicks "Start Recording" and speaks their answer
7. System transcribes audio and generates feedback
8. User can continue to next question or end interview

## Performance Considerations

### Optimization Strategies
- Audio buffering for smooth streaming
- Real-time metric calculations on client-side
- Optimized WebSocket message sizes
- Caching of user sessions
- Rate limiting on OpenAI API calls

### Scalability
- Connection pooling for database
- Redis caching for frequently asked questions
- Load balancing for multiple server instances
- CDN for audio asset delivery

## Error Handling

### Common Errors
1. **Microphone Access Denied**: User must grant microphone permissions
2. **Network Disconnection**: Attempt to reconnect automatically
3. **Transcription Failure**: Fallback to manual text entry
4. **OpenAI API Limit**: Queue requests and retry with exponential backoff

## Testing

### Test Scenarios
1. Start a new live session
2. Record audio response
3. Verify transcription accuracy
4. Check metrics calculation
5. Validate feedback generation
6. Test session completion and metrics saving

### Browser Support
- Chrome/Edge 60+
- Firefox 55+
- Safari 14.1+
(Requires Web Audio API and MediaRecorder API)

## Future Enhancements

1. **Multi-language Support**: Support for interviews in different languages
2. **Video Mode**: Add webcam support for video interviews
3. **Collaborative Interviews**: Multiple candidates in same session
4. **Custom Question Banks**: Allow users to upload custom questions
5. **Advanced Analytics**: Skill gap analysis and recommendations
6. **Peer Comparison**: Benchmark against other users
7. **Integration with ATS**: Export performance reports for recruiters

## Troubleshooting

### Issue: No audio captured
- Check browser microphone permissions
- Ensure microphone is not muted
- Verify Web Audio API compatibility

### Issue: Transcription not working
- Verify OpenAI API key is set
- Check network connectivity
- Monitor API usage quota

### Issue: Slow feedback generation
- Check OpenAI API response times
- Verify network latency
- Ensure server resources are available

## Support & Documentation

- API Documentation: See /docs/08_API.md
- AI Prompts: See /docs/09_AI_PROMPTS.md
- Deployment: See /docs/12_DEPLOYMENT.md
- Architecture: See /docs/06_ARCHITECTURE.md
