const service = require('./users.service');

exports.list = async (req, res, next) => {
  try {
    const users = await service.listUsers({ role: req.query.role });
    res.json({ users });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const user = await service.getUser(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const result = await service.createUser(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.changeRole = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id && req.body.role !== 'ADMIN') {
      return res.status(400).json({ message: 'You cannot demote your own account' });
    }
    const user = await service.changeRole(req.params.id, req.body.role);
    res.json({ user });
  } catch (e) { next(e); }
};

exports.deactivate = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot deactivate your own account' });
    }
    const user = await service.setActive(req.params.id, false);
    res.json({ user });
  } catch (e) { next(e); }
};

exports.activate = async (req, res, next) => {
  try {
    const user = await service.setActive(req.params.id, true);
    res.json({ user });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    await service.deleteUser(req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const result = await service.resetPassword(req.params.id);
    res.json(result);
  } catch (e) { next(e); }
};
