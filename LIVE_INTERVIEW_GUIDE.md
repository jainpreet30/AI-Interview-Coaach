# Live AI Interview Feature - Implementation Guide

## Quick Start

### Prerequisites
1. Node.js 16+ installed
2. MongoDB running (local or Atlas)
3. OpenAI API key with GPT-4 and Whisper access
4. Chrome/Firefox/Safari browser with microphone support

### Installation

#### Backend Setup
```bash
cd server
npm install
```

Add to `.env` file:
```env
AI_API_KEY=sk-your-openai-api-key
AI_MODEL=gpt-4
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/interview-coach
PORT=5000
```

Start the server:
```bash
npm run dev
```

#### Frontend Setup
```bash
cd client
npm install
```

Add to `.env.local` file:
```env
VITE_API_URL=http://localhost:5000
```

Start the development server:
```bash
npm run dev
```

## How to Use the Live Interview Feature

### Step 1: Navigate to Live Interview
1. Log in to the dashboard
2. Click the green "🎤 Live Interview" button in the page header
3. You'll be taken to the interview configuration page

### Step 2: Configure Your Interview
1. **Category**: Select from Data Structures, Algorithms, System Design, Behavioral, or General
2. **Difficulty**: Choose Easy, Medium, or Hard
3. **Target Role**: Enter the position you're practicing for (e.g., "Senior Frontend Engineer")
4. **Interviewer Persona**: Choose the interviewer style:
   - FAANG Lead: Rigorous technical questions
   - Startup CTO: Pragmatic problem-solving focus
   - Mentor: Supportive and educational
   - Strict: High-bar expectations
   - Friendly: Encouraging approach

5. Click "🎤 Start Live Interview"

### Step 3: Conduct the Interview
1. **Grant Microphone Access**: Allow the browser to access your microphone
2. **Coach Introduction**: Listen to the AI coach's introduction and first question
3. **Record Your Answer**: 
   - Click "🎤 Start Recording" when ready
   - Speak your answer naturally
   - Click "Stop Recording" when done
4. **Receive Feedback**:
   - View transcription in real-time
   - See speech metrics (WPM, confidence, filler words)
   - Read AI coach feedback and score
   - Review strengths and improvement areas
5. **Continue**: Click "Continue to Next Question" for the next question or "End Interview" to finish

### Step 4: Review Your Performance
- After ending, view your final metrics
- Session is saved to your dashboard
- Access past interviews from the Recent Mock Interviews section

## Technical Architecture

### Real-time Communication Flow

```
User speaks → Browser records audio → WebSocket sends to server
                                          ↓
                                    Transcribe with Whisper
                                          ↓
                                    Calculate metrics
                                          ↓
                                    Generate feedback with GPT-4
                                          ↓
                                    Generate voice response with TTS
                                          ↓
                                    Send back via WebSocket
                                          ↓
Display transcription, metrics, feedback, and play voice response
```

### Key Components

#### Backend Components
- **LiveSession Model**: Stores complete interview data
- **liveAiService**: Handles all AI operations
- **liveSessionController**: REST API endpoints
- **liveInterviewSocket**: Real-time WebSocket communication
- **JWT Verification**: Secures WebSocket connections

#### Frontend Components
- **LiveInterviewStartPage**: Interview configuration UI
- **LiveInterviewPage**: Main interview interface
- **useLiveInterview Hook**: WebSocket and audio management
- **useAudioRecorder Hook**: Audio recording management
- **useAudioPlayback Hook**: Audio playback management
- **useSpeechMetrics Hook**: Real-time metric calculations

## API Reference

### REST Endpoints

#### Create Live Session
```http
POST /api/v1/live-sessions
Authorization: Bearer {token}

{
  "category": "Data Structures",
  "difficulty": "medium",
  "targetRole": "Senior Frontend Engineer",
  "interviewerPersona": "faang-lead",
  "resumeText": "optional",
  "jobDescription": "optional"
}

Response: {
  "session": {
    "_id": "...",
    "category": "Data Structures",
    "difficulty": "medium",
    "coachIntroduction": "...",
    "firstQuestion": "..."
  }
}
```

#### List Live Sessions
```http
GET /api/v1/live-sessions?status=in-progress
Authorization: Bearer {token}

Response: {
  "sessions": [...]
}
```

#### Get Session Details
```http
GET /api/v1/live-sessions/{sessionId}
Authorization: Bearer {token}
```

#### Complete Session
```http
PUT /api/v1/live-sessions/{sessionId}/complete
Authorization: Bearer {token}

{
  "sessionNotes": "optional notes"
}
```

### WebSocket Events

#### Client → Server

**start-session**
```json
{
  "sessionId": "...",
  "token": "..."
}
```

**submit-answer**
```json
{
  "sessionId": "...",
  "audioBuffer": "Uint8Array",
  "durationSeconds": 15
}
```

**end-session**
```json
{
  "sessionId": "..."
}
```

#### Server → Client

**session-started**
```json
{
  "message": "Session started successfully",
  "currentQuestion": "...",
  "transcript": []
}
```

**transcription-complete**
```json
{
  "speaker": "candidate",
  "text": "...",
  "metrics": {
    "wpm": 140,
    "wordCount": 85,
    "confidenceScore": 78,
    "fillerWordCount": 2,
    "fillerWordsFound": ["um", "like"]
  }
}
```

**coaching-response**
```json
{
  "feedback": "Good answer...",
  "score": 7,
  "strengths": ["Technical depth", "Clear explanation"],
  "areasForImprovement": ["More metrics", "Deeper analysis"],
  "nextResponse": "Great! Now let me ask...",
  "nextQuestion": "Can you explain..."
}
```

## Troubleshooting

### Issue: "Permission to access microphone denied"
**Solution**: Check browser settings and allow microphone access for the site

### Issue: "Connection timeout"
**Solution**: Verify server is running on correct port and CORS is configured

### Issue: "Transcription failing"
**Solution**: 
- Check OpenAI API key is correct
- Verify API has Whisper model access
- Check network connectivity

### Issue: "Feedback not generating"
**Solution**:
- Verify OpenAI API quota
- Check API response times
- Ensure sufficient tokens in API account

### Issue: "Audio not recording"
**Solution**:
- Check browser supports Web Audio API
- Verify microphone is connected and working
- Try a different browser

## Monitoring & Debugging

### Enable Debug Logs
In `client/src/hooks/useLiveInterview.js`:
```javascript
// Uncomment for detailed logs
console.log('Socket event:', data);
```

In `server/src/websocket/liveInterviewSocket.js`:
```javascript
console.log('WebSocket event:', data);
```

### Check WebSocket Connection
Open browser DevTools → Network → WS (WebSocket)

### Monitor API Calls
Open browser DevTools → Network → XHR/Fetch

### View Database Documents
```bash
# MongoDB query to see sessions
db.livesessions.findOne({userId: ObjectId("...")})
```

## Performance Optimization Tips

1. **Audio Quality**: Use 16-bit PCM audio at 16kHz for faster transcription
2. **Batch Processing**: Group metrics calculations
3. **Cache Questions**: Pre-generate questions during setup
4. **Connection Pooling**: Reuse database connections
5. **CDN for Assets**: Serve audio files from CDN

## Security Considerations

1. **JWT Verification**: All WebSocket connections require valid JWT
2. **Rate Limiting**: Implement rate limiting on API endpoints
3. **Input Validation**: Validate all audio and text inputs
4. **API Keys**: Store AI API keys in environment variables only
5. **HTTPS/WSS**: Use secure connections in production
6. **CORS**: Restrict to trusted domains only

## Testing Checklist

- [ ] Create new live session successfully
- [ ] Audio recording works without errors
- [ ] Transcription appears in real-time
- [ ] Metrics display correctly
- [ ] AI feedback generates within 5 seconds
- [ ] Can continue to next question
- [ ] Session saves after completion
- [ ] Can end interview early
- [ ] Responsive on mobile (portrait/landscape)
- [ ] Works on Chrome, Firefox, Safari
- [ ] Handles connection loss gracefully
- [ ] Proper error messages for API failures

## Next Steps for Production

1. **Deployment**:
   - Deploy backend to Render/Heroku/AWS
   - Deploy frontend to Vercel/Netlify
   - Update API URLs in environment

2. **Scaling**:
   - Add Redis for caching
   - Use database read replicas
   - Implement API rate limiting
   - Set up monitoring/alerting

3. **Enhancements**:
   - Add video interview mode
   - Multi-language support
   - Advanced analytics dashboard
   - Peer comparison features
   - Integration with resume parsers

## Support & Resources

- **OpenAI API Docs**: https://platform.openai.com/docs
- **Socket.io Docs**: https://socket.io/docs
- **MongoDB Docs**: https://docs.mongodb.com
- **React Docs**: https://react.dev
- **Project Documentation**: See `/docs` folder

## Common Patterns

### Recording Audio Chunk by Chunk
```javascript
const chunks = [];
mediaRecorder.ondataavailable = (e) => {
  chunks.push(e.data);
};
```

### Calculating WPM in Real-time
```javascript
const wordCount = text.split(/\s+/).length;
const wpm = (wordCount / durationSeconds) * 60;
```

### Detecting Filler Words
```javascript
const fillerWords = ['um', 'uh', 'like', 'basically'];
const count = fillerWords.reduce((acc, word) => {
  const matches = text.match(new RegExp(`\\b${word}\\b`, 'gi'));
  return acc + (matches?.length || 0);
}, 0);
```

## Questions?

Refer to the comprehensive documentation in `live-ai.md` for detailed API specifications, architecture diagrams, and advanced configuration options.
