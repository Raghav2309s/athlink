'use strict';

const bcrypt = require('bcryptjs');
const crypto = require('crypto');

function hashPassword(password, cost = 12) {
  return bcrypt.hash(password, cost);
}

function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSessionToken,
};