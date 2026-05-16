const express = require('express');
const prisma = require('../db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(verifyToken, requireAdmin);

router.get('/polls', async (req, res) => {
  const polls = await prisma.poll.findMany({
    include: {
      options: { include: { _count: { select: { votes: true } } } },
      creator: { select: { id: true, username: true } },
      _count: { select: { options: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  const result = polls.map(poll => ({
    id: poll.id,
    question: poll.question,
    isActive: poll.isActive,
    createdAt: poll.createdAt,
    creator: poll.creator,
    totalVotes: poll.options.reduce((s, o) => s + (o._count?.votes ?? 0), 0),
    optionCount: poll._count.options,
  }));
  res.json(result);
});

router.patch('/polls/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'Az isActive mező boolean értéket vár.' });
  }
  try {
    const poll = await prisma.poll.update({ where: { id }, data: { isActive } });
    res.json(poll);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Szavazás nem található.' });
    throw err;
  }
});

router.delete('/polls/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: 'Érvénytelen azonosító.' });
  try {
    await prisma.poll.delete({ where: { id } });
    res.json({ message: 'Szavazás törölve.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Szavazás nem található.' });
    throw err;
  }
});

module.exports = router;
