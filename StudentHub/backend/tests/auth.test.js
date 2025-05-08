const request = require('supertest');
const app = require('../index'); // Adjust if your app export is different

describe('Auth API', () => {
  it('should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        name: 'Test User',
        institution: 'Test University',
        faculty: 'Science',
        courses: ['Math', 'Physics'],
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toMatch(/verify your email/i);
  });

  it('should not register with invalid email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'invalidemail',
        password: 'password123',
        name: 'Test User',
      });
    expect(res.statusCode).toEqual(422);
  });

  it('should login a user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('token');
  });
});
