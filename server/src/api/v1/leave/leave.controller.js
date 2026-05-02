const service = require('./leave.service');

exports.getMyLeaves = async (req, res, next) => {
  try {
    const result = await service.getMyLeaves(req.user.id);
    res.json(result);
  } catch (e) { next(e); }
};

exports.getMyBalance = async (req, res, next) => {
  try {
    const result = await service.getMyLeaveBalance(req.user.id);
    res.json(result);
  } catch (e) { next(e); }
};

exports.apply = async (req, res, next) => {
  try {
    const result = await service.applyLeave(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.listQueue = async (req, res, next) => {
  try {
    const result = await service.getLeaveQueue();
    res.json({ leaves: result });
  } catch (e) { next(e); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const result = await service.updateLeaveStatus(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (e) { next(e); }
};

module.exports = exports;
