const express = require('express');
const prisma = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/vote', verifyToken, async (req, res) => {
  const { optionId } = req.body;
  if (!optionId || typeof optionId !== 'number' || optionId < 1) {
    return res.status(400).json({ error: 'Érvényes lehetőség azonosítója szükséges.' });
  }
  const option = await prisma.option.findUnique({
    where: { id: optionId },
    include: { poll: { select: { id: true, isActive: true } } },
  });
  if (!option) return res.status(404).json({ error: 'A lehetőség nem létezik.' });
  if (!option.poll.isActive) {
    return res.status(400).json({ error: 'Ez a szavazás már lezárt.' });
  }
  try {
    const vote = await prisma.vote.create({
      data: { userId: req.user.id, optionId, pollId: option.poll.id },
    });
    res.json({ message: 'Szavazat sikeresen leadva!', vote });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Erre a szavazásra már szavaztál.' });
    }
    throw err;
  }
});

module.exports = router;
