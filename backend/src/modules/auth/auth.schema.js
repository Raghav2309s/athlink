'use strict';

const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
});

const registerSchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(128),
  role: z.enum(['PLAYER', 'COACH', 'ORGANIZATION']),
});

module.exports = {
  loginSchema,
  registerSchema,
};