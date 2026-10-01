'use strict';

const { z } = require('zod');

const experienceLevels = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'PROFESSIONAL',
];

const playerProfileSchema = z.object({
  fullName: z.string().min(2).max(160),
  dateOfBirth: z.string().date().optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  experienceLevel: z.enum(experienceLevels).optional().nullable(),
  university: z.string().max(200).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

const coachProfileSchema = z.object({
  fullName: z.string().min(2).max(160),
  bio: z.string().max(2000).optional().nullable(),
  experienceYears: z.number().min(0).max(999.9).optional().nullable(),
  certification: z.string().max(200).optional().nullable(),
  academyName: z.string().max(200).optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

const organizationProfileSchema = z.object({
  name: z.string().min(2).max(200),
  type: z.enum([
    'GOVERNMENT',
    'PRIVATE',
    'UNIVERSITY',
    'CLUB',
    'ASSOCIATION',
  ]),
  description: z.string().max(3000).optional().nullable(),
  contactEmail: z.string().email().max(320).optional().nullable(),
  contactPhone: z.string().max(32).optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
});

const sportSchema = z.object({
  sportId: z.string().uuid(),
  isPrimary: z.boolean().optional().default(false),
  yearsExperience: z.number().min(0).max(999.9).optional().nullable(),
});

const sportsUpdateSchema = z.object({
  sports: z.array(sportSchema).max(20),
});

module.exports = {
  playerProfileSchema,
  coachProfileSchema,
  organizationProfileSchema,
  sportsUpdateSchema,
};
