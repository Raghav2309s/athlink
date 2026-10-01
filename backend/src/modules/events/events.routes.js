'use strict';

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  createEvent,
  listEvents,
  getEvent,
  updateEvent,
  publishEvent,
  registerForEvent,
  listRegistrations,
} = require('./events.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/', listEvents);
router.get('/:id', getEvent);

router.post('/', createEvent);
router.patch('/:id', updateEvent);
router.post('/:id/publish', publishEvent);

router.post('/:id/register', registerForEvent);
router.get('/:id/registrations', listRegistrations);

module.exports = router;
