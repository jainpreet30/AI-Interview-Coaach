const request = require('supertest');

let app;

beforeAll(async () => {
  const module = await import('./app.js');
  app = module.default;
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
});
