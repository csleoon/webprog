require('dotenv').config();
const express = require('express');
const path = require('path');
const prisma = require('./db');

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const authRoutes = require('./routes/authRoutes');
const pollRoutes = require('./routes/pollRoutes');
const voteRoutes = require('./routes/voteRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api', authRoutes);
app.use('/api', pollRoutes);
app.use('/api', voteRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Szerverhiba történt.' });
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`Szerver fut: http://localhost:${PORT}`));
}

module.exports = { app, prisma };
