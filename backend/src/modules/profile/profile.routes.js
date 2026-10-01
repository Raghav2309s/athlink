'use strict';

const express = require('express');
const {
  getProfile,
  updateProfile,
  updateSports,
} = require('./profile.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.put('/me/sports', updateSports);

module.exports = router;
