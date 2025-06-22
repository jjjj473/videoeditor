const request = require('supertest');
// Import the app from index.js
const app = require('../index');

// For tests, export the express app from index.js

describe('POST /upload', () => {
  it('should return 400 when files are missing', async () => {
    const res = await request(app).post('/upload').field('foo', 'bar');
    expect(res.status).toBe(400);
  });
});
