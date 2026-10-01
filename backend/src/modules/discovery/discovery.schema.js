'use strict';

const { z } = require('zod');

const coachDiscoverySchema = z.object({
  sportId: z.string().uuid().optional(),
  localityId: z.string().uuid().optional(),
});

module.exports = {
  coachDiscoverySchema,
};
