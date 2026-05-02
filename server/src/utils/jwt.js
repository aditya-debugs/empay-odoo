const jwt = require('jsonwebtoken');
const env = require('../config/env');

exports.signToken = (payload) =>
  jwt.sign(payload, env.jwt.secret, { expiresIn: env.jwt.expiresIn });

exports.verifyToken = (token) => jwt.verify(token, env.jwt.secret);
