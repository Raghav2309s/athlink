'use strict';

const express = require('express');
const { requireAuth } = require('../../middleware/auth');
const { discoverCoaches } = require('./discovery.controller');

const router = express.Router();

router.use(requireAuth);

router.get('/coaches', discoverCoaches);

module.exports = router;
