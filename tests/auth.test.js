process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./prisma/test.db';

const request = require('supertest');
const { app } = require('../src/server');
const prisma = require('../src/db');

beforeEach(async () => {
  await prisma.vote.deleteMany();
  await prisma.option.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('POST /api/register', () => {
  test('regisztrál egy új felhasználót és tokent ad vissza', async () => {
    const res = await request(app).post('/api/register').send({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  test('hibát ad vissza duplikált email esetén', async () => {
    await request(app).post('/api/register').send({
      username: 'user1',
      email: 'dupe@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/register').send({
      username: 'user2',
      email: 'dupe@example.com',
      password: 'password456',
    });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });
});

describe('POST /api/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/register').send({
      username: 'loginuser',
      email: 'login@example.com',
      password: 'correctpass',
    });
  });

  test('helyes adatokkal tokent ad vissza', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'login@example.com',
      password: 'correctpass',
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toHaveProperty('role');
  });

  test('hibás jelszóval 401-et ad vissza', async () => {
    const res = await request(app).post('/api/login').send({
      email: 'login@example.com',
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });
});
