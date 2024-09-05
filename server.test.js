const request = require('supertest');
const app = require('./server');

describe('API Endpoints', () => {
  it('should require authentication for /api/matches', async () => {
    const res = await request(app).get('/api/matches');
    expect(res.statusCode).toEqual(403);
  });

  // Add more tests here
});