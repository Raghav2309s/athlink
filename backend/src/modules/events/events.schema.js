'use strict';

const { z } = require('zod');

const eventCategories = [
  'TOURNAMENT',
  'TRAINING',
  'TRIAL',
  'MEETUP',
  'WORKSHOP',
  'OTHER',
];

const createEventSchema = z.object({
  title: z.string().min(2).max(200),
  sportId: z.string().uuid(),
  category: z.enum(eventCategories),
  startsAt: z.string().datetime({ offset: true }),
  endsAt: z.string().datetime({ offset: true }),
  description: z.string().max(5000).optional().nullable(),
  facilityId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  eligibilityText: z.string().max(2000).optional().nullable(),
});

const updateEventSchema = createEventSchema.partial();

module.exports = {
  createEventSchema,
  updateEventSchema,
  eventCategories,
};
