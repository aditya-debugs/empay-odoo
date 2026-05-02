const service = require('./users.service');

exports.create = async (req, res, next) => {
  try {
    const result = await service.createUser(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const users = await service.listUsers(req.query);
    res.json(users);
  } catch (e) {
    next(e);
  }
};

module.exports = exports;
