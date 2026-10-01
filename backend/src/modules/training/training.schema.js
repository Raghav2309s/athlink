'use strict';

const { z } = require('zod');

const createTrainingRequestSchema = z.object({
  coachUserId: z.string().uuid(),
  sportId: z.string().uuid(),
  message: z.string().max(2000).optional().nullable(),
});

const updateTrainingRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED']),
});

module.exports = {
  createTrainingRequestSchema,
  updateTrainingRequestSchema,
};
