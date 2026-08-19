# Live AI Interview Feature

## Quick Start

Requirements:

- Node.js 16+
- MongoDB local or Atlas
- Chrome or Edge for browser SpeechRecognition and SpeechSynthesis
- Optional Gemini API key for adaptive coaching

Backend `.env`:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-3.6-flash
JWT_SECRET=your-jwt-secret
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/ai-interview-coach
PORT=5000
```

Start the backend and frontend:

```bash
cd server
npm install
npm run dev

cd client
npm install
npm run dev
```

## Interview Flow

1. Log in and open **Live Interview**.
2. Choose category, difficulty, target role, and interviewer persona.
3. Add resume text or a job description when personalization is needed.
4. Allow microphone access.
5. Gemini creates the introduction and first question.
6. Browser SpeechSynthesis speaks the question.
7. Click **Start Recording**, speak, and watch the interim transcript.
8. Stop recording to send the final transcript to the server.
9. Gemini evaluates the answer and returns one adaptive follow-up question.
10. Browser SpeechSynthesis speaks the feedback and next question.
11. End the session to open the detailed evaluation report.

## Architecture

```text
Gemini introduction and question
              ↓
Browser SpeechSynthesis
              ↓
Candidate speaks
              ↓
Browser SpeechRecognition
              ↓
Transcript + speech metrics
              ↓
Gemini evaluation and one next question
              ↓
Browser SpeechSynthesis
              ↓
Persist transcript, turn evaluation, and final metrics
```

The live feature no longer uses OpenAI for transcription, text-to-speech, or coaching. The separate mock-practice service may still contain its own provider integration.

## Personalization

Gemini receives the current question, recent conversation, interviewer persona, target role, category, difficulty, resume text, and job description. It generates one question at a time and uses the candidate's answer to decide whether to probe deeper or move to a new topic.

## Stored Data

Each completed turn stores:

- The exact question asked
- Candidate answer and timestamps
- Speech metrics
- Score, feedback, strengths, and improvement areas
- Technical, communication, relevance, and structure scores
- Adaptive follow-up question

Completed sessions are available at `/live-interview/:sessionId/report` and contribute to dashboard readiness, skills, recommendations, and live interview history.

## Browser Compatibility

Chrome and Edge provide the most complete experience. Firefox and privacy-focused browsers may not implement `SpeechRecognition`; the page displays a compatibility error and cannot provide the browser transcript in that case.

Microphone access requires `localhost` or HTTPS. If access is denied, allow the microphone in browser site settings and reload the page.

## Gemini Configuration

Create a Gemini API key from Google AI Studio, then set `GEMINI_API_KEY`. The default model is `gemini-3.6-flash`; override it with `GEMINI_MODEL` when needed. If the key is missing or Gemini is unavailable, the local fallback evaluator keeps the interview functional with deterministic rubric feedback.
