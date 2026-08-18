import LiveSession from '../models/LiveSession.js';
import {
  transcribeAudio,
  generateCoachVoice,
  calculateSpeechMetrics,
  generateCoachingResponse
} from '../services/liveAiService.js';
import { verifyToken } from '../services/jwtService.js';

const activeSessions = new Map(); // Store active session data

export function setupLiveInterviewSocket(io) {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Handle session start
    socket.on('start-session', async (data) => {
      try {
        const { sessionId, token } = data;

        // Verify user authentication
        const decoded = verifyToken(token);
        if (!decoded) {
          socket.emit('error', { message: 'Authentication failed' });
          socket.disconnect();
          return;
        }

        // Get session from database
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        if (!session.userId.equals(decoded.id)) {
          socket.emit('error', { message: 'Unauthorized access' });
          return;
        }

        // Update session status
        session.status = 'in-progress';
        session.startedAt = new Date();
        await session.save();

        // Store active session info
        activeSessions.set(sessionId, {
          userId: decoded.id,
          socketId: socket.id,
          currentTranscript: [],
          startTime: Date.now(),
          audioChunks: []
        });

        socket.join(`session-${sessionId}`);

        socket.emit('session-started', {
          message: 'Session started successfully',
          currentQuestion: session.currentQuestion.prompt,
          transcript: session.transcript.map(t => ({
            speaker: t.speaker,
            text: t.text,
            timestamp: t.timestamp
          }))
        });

        console.log(`Session ${sessionId} started`);
      } catch (error) {
        console.error('Start session error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle audio stream
    socket.on('audio-chunk', async (data) => {
      try {
        const { sessionId, audioData } = data;

        const activeSession = activeSessions.get(sessionId);
        if (!activeSession) {
          return;
        }

        // Store audio chunk
        if (audioData && audioData.length > 0) {
          activeSession.audioChunks.push(Buffer.from(audioData));
        }
      } catch (error) {
        console.error('Audio chunk error:', error);
      }
    });

    // Handle answer submission with transcription
    socket.on('submit-answer', async (data) => {
      try {
        const { sessionId, audioBuffer, durationSeconds } = data;

        const activeSession = activeSessions.get(sessionId);
        if (!activeSession) {
          socket.emit('error', { message: 'Session not active' });
          return;
        }

        // Transcribe audio
        const transcriptionResult = await transcribeAudio(Buffer.from(audioBuffer));

        if (!transcriptionResult.success) {
          socket.emit('transcription-error', {
            message: 'Failed to transcribe audio',
            error: transcriptionResult.error
          });
          return;
        }

        const candidateText = transcriptionResult.text;

        // Calculate speech metrics
        const metrics = calculateSpeechMetrics(candidateText, durationSeconds);

        // Get session from database
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        // Add to transcript
        const candidateEntry = {
          speaker: 'candidate',
          text: candidateText,
          timestamp: new Date(),
          speechMetrics: metrics
        };

        session.transcript.push(candidateEntry);

        // Emit transcription to client
        io.to(`session-${sessionId}`).emit('transcription-complete', {
          speaker: 'candidate',
          text: candidateText,
          metrics
        });

        // Generate AI coaching response
        const coachingResponse = await generateCoachingResponse({
          currentQuestion: session.currentQuestion.prompt,
          candidateAnswer: candidateText,
          speechMetrics: metrics,
          interviewerPersona: session.interviewerPersona,
          targetRole: session.targetRole,
          conversationContext: session.transcript.slice(-6).map(t => ({
            speaker: t.speaker,
            text: t.text
          }))
        });

        if (!coachingResponse.success) {
          console.error('Coaching generation failed:', coachingResponse.error);
        }

        // Generate coach voice response
        let audioUrl = null;
        try {
          const voiceResponse = await generateCoachVoice(coachingResponse.nextResponse);
          if (voiceResponse.success) {
            // In production, you'd upload this to cloud storage
            // For now, we'll convert to base64
            audioUrl = voiceResponse.audioBuffer.toString('base64');
          }
        } catch (error) {
          console.error('Voice generation error:', error);
        }

        // Add coach response to transcript
        const coachEntry = {
          speaker: 'coach',
          text: coachingResponse.nextResponse,
          audioUrl,
          timestamp: new Date(),
          speechMetrics: {
            confidenceScore: 100
          }
        };

        session.transcript.push(coachEntry);

        // Update current question with feedback
        session.currentQuestion = {
          prompt: coachingResponse.followUpQuestions[0] || 'Let me ask the next question',
          coachResponse: coachingResponse.nextResponse,
          feedback: coachingResponse.feedback,
          score: coachingResponse.score,
          followUpQuestions: coachingResponse.followUpQuestions
        };

        await session.save();

        // Emit coaching response to client
        io.to(`session-${sessionId}`).emit('coaching-response', {
          feedback: coachingResponse.feedback,
          score: coachingResponse.score,
          strengths: coachingResponse.strengths,
          areasForImprovement: coachingResponse.areasForImprovement,
          nextResponse: coachingResponse.nextResponse,
          audioUrl,
          followUpQuestions: coachingResponse.followUpQuestions,
          nextQuestion: coachingResponse.followUpQuestions[0] || 'Tell me more about this.'
        });
      } catch (error) {
        console.error('Submit answer error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle session end
    socket.on('end-session', async (data) => {
      try {
        const { sessionId } = data;

        const session = await LiveSession.findById(sessionId);
        if (session) {
          session.status = 'completed';
          session.completedAt = new Date();
          session.duration = Math.round((session.completedAt - session.startedAt) / 1000);

          // Calculate final metrics
          const candidateTranscripts = session.transcript.filter(t => t.speaker === 'candidate');
          let totalSpeakingTime = 0;
          let totalWPM = 0;
          let totalFillerWords = 0;
          let totalConfidence = 0;

          candidateTranscripts.forEach(t => {
            if (t.speechMetrics) {
              totalSpeakingTime += t.speechMetrics.speakingDurationSeconds || 0;
              totalWPM += t.speechMetrics.wpm || 0;
              totalFillerWords += t.speechMetrics.fillerWordCount || 0;
              totalConfidence += t.speechMetrics.confidenceScore || 0;
            }
          });

          const candidateCount = candidateTranscripts.length || 1;

          session.metrics = {
            totalSpeakingTime,
            averageWPM: Math.round(totalWPM / candidateCount),
            fillerWordCount: totalFillerWords,
            confidenceScore: Math.round(totalConfidence / candidateCount),
            communicationScore: Math.round((100 - (totalFillerWords / candidateCount) * 5) * 0.8),
            overallScore: Math.round(totalConfidence / candidateCount)
          };

          await session.save();
        }

        activeSessions.delete(sessionId);
        socket.leave(`session-${sessionId}`);

        io.to(`session-${sessionId}`).emit('session-ended', {
          message: 'Session ended',
          session: {
            metrics: session?.metrics,
            duration: session?.duration,
            transcript: session?.transcript
          }
        });

        console.log(`Session ${sessionId} ended`);
      } catch (error) {
        console.error('End session error:', error);
        socket.emit('error', { message: error.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);

      // Clean up active sessions
      for (const [sessionId, activeSession] of activeSessions.entries()) {
        if (activeSession.socketId === socket.id) {
          activeSessions.delete(sessionId);
          console.log(`Cleaned up session: ${sessionId}`);
        }
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });
}
