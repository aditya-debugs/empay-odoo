const service = require('./attendance.service');

exports.checkIn = async (req, res, next) => {
  try {
    const attendance = await service.checkIn(req.user.id);
    res.json({ message: 'Checked in successfully', attendance });
  } catch (e) { next(e); }
};

exports.checkOut = async (req, res, next) => {
  try {
    const attendance = await service.checkOut(req.user.id);
    res.json({ message: 'Checked out successfully', attendance });
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const result = await service.getAttendanceHistory(req.user.id, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (e) { next(e); }
};

exports.listAll = async (req, res, next) => {
  try {
    const { date, search } = req.query;
    const result = await service.listAllAttendance({ date, search });
    res.json(result);
  } catch (e) { next(e); }
};

exports.raiseRegularization = async (req, res, next) => {
  try {
    const { date, reason } = req.body;
    if (!date || !reason) return res.status(400).json({ message: 'Date and reason are required' });
    const result = await service.raiseRegularization(req.user.id, { date, reason });
    res.json({ message: 'Request submitted', request: result });
  } catch (e) { next(e); }
};

exports.listRegularizations = async (req, res, next) => {
  try {
    const requests = await service.listRegularizationRequests();
    res.json({ requests });
  } catch (e) { next(e); }
};

exports.reviewRegularization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await service.reviewRegularization(id, req.user.id, { status });
    res.json({ message: 'Request reviewed', request: result });
  } catch (e) { next(e); }
};

module.exports = exports;
