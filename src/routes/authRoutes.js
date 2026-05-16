const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Felhasználónév, email és jelszó megadása kötelező.' });
  }
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash },
    });
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({ message: 'Sikeres regisztráció.', token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Ez az email vagy felhasználónév már foglalt.' });
    }
    throw err;
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email és jelszó megadása kötelező.' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Hibás email vagy jelszó.' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Hibás email vagy jelszó.' });
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (err) {
    throw err;
  }
});

router.get('/me', verifyToken, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      votes: {
        include: {
          option: {
            select: {
              text: true,
              poll: { select: { question: true } },
            },
          },
        },
        orderBy: { castAt: 'desc' },
      },
    },
  });
  if (!user) return res.status(404).json({ error: 'Felhasználó nem található.' });
  res.json(user);
});

module.exports = router;
