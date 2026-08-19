const request = require('supertest');

let app;
let generateCoachingIntroduction;
let generateCoachingResponse;

beforeAll(async () => {
  const module = await import('./services/liveAiService.js');
  generateCoachingIntroduction = module.generateCoachingIntroduction;
  generateCoachingResponse = module.generateCoachingResponse;

  const appModule = await import('./app.js');
  app = appModule.default;
});

describe('Server app', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ok',
      message: expect.any(String),
    });
    expect(new Date(response.body.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('should return 404 for unknown routes', async () => {
    const response = await request(app).get('/api/v1/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body).toEqual({ message: 'Resource not found.' });
  });

  it('should generate a local fallback introduction when AI API key is missing', async () => {
    const response = await generateCoachingIntroduction({
      category: 'General',
      difficulty: 'medium',
      targetRole: 'Software Engineer',
      interviewerPersona: 'faang-lead'
    });

    expect(response).toMatchObject({
      introduction: expect.any(String),
      firstQuestion: expect.any(String),
      success: true
    });
  });

  it('should vary local coaching follow-ups for different answers', async () => {
    const geminiKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const first = await generateCoachingResponse({
        currentQuestion: 'Explain system design trade-offs.',
        candidateAnswer: 'I would use caching and a database to reduce latency.',
        conversationContext: []
      });
      const second = await generateCoachingResponse({
        currentQuestion: 'Explain system design trade-offs.',
        candidateAnswer: 'I would focus on testing, deployment, and failure recovery across services.',
        conversationContext: [{ speaker: 'coach', text: 'Previous question' }]
      });

      expect(first.nextQuestion).not.toBe(second.nextQuestion);
      expect(first.nextResponse).not.toBe(second.nextResponse);
    } finally {
      if (geminiKey) process.env.GEMINI_API_KEY = geminiKey;
    }
  });
});
