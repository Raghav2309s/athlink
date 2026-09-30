'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const { env } = require('./config/env');
const authRoutes = require('./modules/auth/auth.routes');
const { errorHandler } = require('./middleware/error');

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({
    data: {
      status: 'ok',
      service: 'athlink-api',
    },
  });
});

app.use('/api/v1/auth', authRoutes);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`ATHLINK API running on port ${env.PORT}`);
});

module.exports = {
  app,
  server,
};