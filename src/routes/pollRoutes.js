const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

function formatPoll(poll) {
  const totalVotes = poll.options.reduce((sum, o) => sum + (o._count?.votes ?? 0), 0);
  return {
    id: poll.id,
    question: poll.question,
    isActive: poll.isActive,
    createdAt: poll.createdAt,
    creator: poll.creator ? { id: poll.creator.id, username: poll.creator.username } : null,
    totalVotes,
    options: poll.options.map(o => ({
      id: o.id,
      text: o.text,
      voteCount: o._count?.votes ?? 0,
    })),
  };
}

router.get('/polls', async (req, res) => {
  const polls = await prisma.poll.findMany({
    where: { isActive: true },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { id: true, username: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(polls.map(formatPoll));
});

router.get('/polls/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  const poll = await prisma.poll.findFirst({
    where: { id, isActive: true },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { id: true, username: true } },
    },
  });
  if (!poll) return res.status(404).json({ error: 'Szavazás nem található.' });
  res.json(formatPoll(poll));
});

router.post('/polls', verifyToken, async (req, res) => {
  const { question, options } = req.body;
  if (!question || typeof question !== 'string' || !question.trim()) {
    return res.status(400).json({ error: 'A kérdés megadása kötelező.' });
  }
  if (!Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Legalább 2 lehetőség megadása szükséges.' });
  }
  const texts = options.map(o => (typeof o === 'string' ? o : o?.text ?? '')).filter(t => t.trim());
  if (texts.length < 2) {
    return res.status(400).json({ error: 'Legalább 2 nem üres lehetőség szükséges.' });
  }
  const poll = await prisma.poll.create({
    data: {
      question: question.trim(),
      creatorId: req.user.id,
      options: { create: texts.map(text => ({ text: text.trim() })) },
    },
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { id: true, username: true } },
    },
  });
  res.status(201).json(formatPoll(poll));
});

module.exports = router;
