const express = require('express');
const cors = require('cors');
const config = require('./config');
const connectDB = require('./config/db');

const app = express();

app.use(cors({ origin: config.clientUrl }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/gemini', require('./routes/geminiRoutes'));

// 404 for unknown API routes
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

// Central error handler (also catches Multer errors)
app.use((err, req, res, next) => {
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : err.status || 400;
  const message = err.code === 'LIMIT_FILE_SIZE' ? 'File too large (max 5MB)' : err.message;
  res.status(status).json({ message });
});

connectDB(config.mongoUri).then(() => {
  app.listen(config.port, () => console.log(`Server running on port ${config.port}`));
});
