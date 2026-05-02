const service = require('./auth.service');

exports.adminExists = async (_req, res, next) => {
  try {
    res.json({ exists: await service.adminExists() });
  } catch (e) { next(e); }
};

exports.registerAdmin = async (req, res, next) => {
  try {
    const result = await service.registerAdmin(req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const result = await service.login(req.body);
    res.json(result);
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await service.getMe(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (e) { next(e); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user = await service.changePassword(req.user.id, req.body);
    res.json({ message: 'Password changed successfully', user });
  } catch (e) { next(e); }
};

exports.logout = (_req, res) => res.status(204).end();
