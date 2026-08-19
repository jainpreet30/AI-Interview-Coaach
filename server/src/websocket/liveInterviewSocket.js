import LiveSession from '../models/LiveSession.js';
import {
  calculateSpeechMetrics,
  generateCoachingResponse
} from '../services/liveAiService.js';
import { verifyToken } from '../services/jwtService.js';

const activeSessions = new Map(); // Store active session data

export function setupLiveInterviewSocket(io) {
  // Middleware to verify JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.userId = decoded.id || decoded.sub;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id} (userId: ${socket.userId})`);

    // Handle session start
    socket.on('start-session', async (data) => {
      try {
        const { sessionId } = data;

        // Get session from database
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const askedQuestion = session.currentQuestion.prompt;

        // Verify user owns this session
        if (!session.userId.equals(socket.userId)) {
          socket.emit('error', { message: 'Unauthorized access' });
          return;
        }

        // Update session status
        session.status = 'in-progress';
        session.startedAt = new Date();
        await session.save();

        // Store active session info
        activeSessions.set(sessionId, {
          userId: socket.userId,
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
        const { sessionId, transcript, durationSeconds } = data;

        const activeSession = activeSessions.get(sessionId);
        if (!activeSession) {
          socket.emit('error', { message: 'Session not active' });
          return;
        }

        const candidateText = transcript?.trim();
        if (!candidateText) {
          socket.emit('transcription-error', {
            message: 'No browser transcript was received. Please try recording your answer again.'
          });
          return;
        }

        // Calculate speech metrics
        const metrics = calculateSpeechMetrics(candidateText, durationSeconds);

        // Get session from database
        const session = await LiveSession.findById(sessionId);
        if (!session) {
          socket.emit('error', { message: 'Session not found' });
          return;
        }

        const askedQuestion = session.currentQuestion?.prompt || 'Tell me about your approach.';

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
          currentQuestion: askedQuestion,
          candidateAnswer: candidateText,
          speechMetrics: metrics,
          interviewerPersona: session.interviewerPersona,
          targetRole: session.targetRole,
          category: session.category,
          difficulty: session.difficulty,
          resumeText: session.resumeText,
          jobDescription: session.jobDescription,
          conversationContext: session.transcript.slice(-6).map(t => ({
            speaker: t.speaker,
            text: t.text
          }))
        });

        if (!coachingResponse.success) {
          console.error('Coaching generation failed:', coachingResponse.error);
        }

        // Add coach response to transcript
        const coachEntry = {
          speaker: 'coach',
          text: coachingResponse.nextResponse,
          timestamp: new Date(),
          speechMetrics: {
            confidenceScore: 100
          }
        };

        session.transcript.push(coachEntry);

        // Update current question with feedback
        const nextQuestion = coachingResponse.nextQuestion || coachingResponse.followUpQuestions[0] || 'Tell me more about this.';
        session.currentQuestion = {
          prompt: nextQuestion,
          coachResponse: coachingResponse.nextResponse,
          feedback: coachingResponse.feedback,
          score: coachingResponse.score,
          followUpQuestions: coachingResponse.followUpQuestions
        };

        if (!session.turns) session.turns = [];
        session.turns.push({
          question: askedQuestion,
          answer: candidateText,
          askedAt: new Date(),
          answeredAt: new Date(),
          evaluation: {
            score: coachingResponse.score,
            feedback: coachingResponse.feedback,
            strengths: coachingResponse.strengths,
            areasForImprovement: coachingResponse.areasForImprovement,
            technicalScore: coachingResponse.technicalScore,
            communicationScore: coachingResponse.communicationScore,
            relevanceScore: coachingResponse.relevanceScore,
            structureScore: coachingResponse.structureScore
          },
          followUpQuestion: nextQuestion,
          state: 'feedback'
        });

        await session.save();

        // Emit coaching response to client
        io.to(`session-${sessionId}`).emit('coaching-response', {
          feedback: coachingResponse.feedback,
          score: coachingResponse.score,
          strengths: coachingResponse.strengths,
          areasForImprovement: coachingResponse.areasForImprovement,
          nextResponse: coachingResponse.nextResponse,
          followUpQuestions: coachingResponse.followUpQuestions,
          nextQuestion,
          technicalScore: coachingResponse.technicalScore,
          communicationScore: coachingResponse.communicationScore,
          relevanceScore: coachingResponse.relevanceScore,
          structureScore: coachingResponse.structureScore
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
          let totalTechnical = 0;
          let totalCommunication = 0;
          let totalRelevance = 0;
          let totalStructure = 0;

          candidateTranscripts.forEach(t => {
            if (t.speechMetrics) {
              totalSpeakingTime += t.speechMetrics.speakingDurationSeconds || 0;
              totalWPM += t.speechMetrics.wpm || 0;
              totalFillerWords += t.speechMetrics.fillerWordCount || 0;
              totalConfidence += t.speechMetrics.confidenceScore || 0;
            }
          });

          (session.turns || []).forEach((turn) => {
            totalTechnical += turn.evaluation?.technicalScore || 0;
            totalCommunication += turn.evaluation?.communicationScore || 0;
            totalRelevance += turn.evaluation?.relevanceScore || 0;
            totalStructure += turn.evaluation?.structureScore || 0;
          });

          const candidateCount = candidateTranscripts.length || 1;

          session.metrics = {
            totalSpeakingTime,
            averageWPM: Math.round(totalWPM / candidateCount),
            fillerWordCount: totalFillerWords,
            confidenceScore: Math.round(totalConfidence / candidateCount),
            communicationScore: totalCommunication
              ? Math.round((totalCommunication / candidateCount) * 10)
              : Math.round((100 - (totalFillerWords / candidateCount) * 5) * 0.8),
            technicalScore: totalTechnical ? Math.round((totalTechnical / candidateCount) * 10) : 0,
            clarityScore: totalStructure ? Math.round((totalStructure / candidateCount) * 10) : 0,
            overallScore: totalRelevance
              ? Math.round((totalRelevance / candidateCount) * 10)
              : Math.round(totalConfidence / candidateCount)
          };

          session.finalEvaluationDimensions = {
            clarity: session.metrics.clarityScore,
            technical: session.metrics.technicalScore,
            communication: session.metrics.communicationScore,
            overall: session.metrics.overallScore
          };

          await session.save();
        }

        activeSessions.delete(sessionId);

        io.to(`session-${sessionId}`).emit('session-ended', {
          message: 'Session ended',
          session: {
            metrics: session?.metrics,
            duration: session?.duration,
            transcript: session?.transcript
          }
        });

        socket.leave(`session-${sessionId}`);

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
