process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'file:./prisma/test.db';

const request = require('supertest');
const { app } = require('../src/server');
const prisma = require('../src/db');

let token;

beforeEach(async () => {
  await prisma.vote.deleteMany();
  await prisma.option.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.user.deleteMany();

  const res = await request(app).post('/api/register').send({
    username: 'polluser',
    email: 'polluser@example.com',
    password: 'password123',
  });
  token = res.body.token;
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe('GET /api/polls', () => {
  test('aktív szavazások listáját adja vissza', async () => {
    await prisma.poll.create({
      data: {
        question: 'Teszt kérdés?',
        options: { create: [{ text: 'A' }, { text: 'B' }] },
      },
    });
    const res = await request(app).get('/api/polls');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});

describe('POST /api/polls', () => {
  test('hitelesített felhasználó létrehozhat szavazást', async () => {
    const res = await request(app)
      .post('/api/polls')
      .set('Authorization', `Bearer ${token}`)
      .send({ question: 'Melyik a jobb?', options: ['Opció A', 'Opció B'] });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.question).toBe('Melyik a jobb?');
    expect(res.body.options).toHaveLength(2);
  });

  test('hitelesítés nélkül 401-et ad vissza', async () => {
    const res = await request(app)
      .post('/api/polls')
      .send({ question: 'Teszt?', options: ['A', 'B'] });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/vote', () => {
  let optionId;
  let pollId;

  beforeEach(async () => {
    const poll = await prisma.poll.create({
      data: {
        question: 'Szavazz!',
        options: { create: [{ text: 'Igen' }, { text: 'Nem' }] },
      },
      include: { options: true },
    });
    optionId = poll.options[0].id;
    pollId = poll.id;
  });

  test('sikeresen lead egy szavazatot', async () => {
    const res = await request(app)
      .post('/api/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });

  test('dupla szavazásnál 409-et ad vissza', async () => {
    await request(app)
      .post('/api/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId });

    const res = await request(app)
      .post('/api/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({ optionId });
    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  test('hiányzó optionId esetén 400-at ad vissza', async () => {
    const res = await request(app)
      .post('/api/vote')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
