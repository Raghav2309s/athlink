'use strict';

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const {
  createTrainingRequest,
  listTrainingRequests,
  updateTrainingRequest,
} = require('./training.controller');

const router = express.Router();

router.use(requireAuth);

router.post('/', createTrainingRequest);
router.get('/', listTrainingRequests);
router.patch('/:id', updateTrainingRequest);

module.exports = router;
