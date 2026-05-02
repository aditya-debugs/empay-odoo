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

exports.requestRegularization = async (req, res, next) => {
  try {
    const result = await service.requestRegularization(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.getRegularizationQueue = async (req, res, next) => {
  try {
    const result = await service.getRegularizationQueue();
    res.json(result);
  } catch (e) { next(e); }
};

exports.updateRegularizationStatus = async (req, res, next) => {
  try {
    const result = await service.updateRegularizationStatus(req.params.id, req.user.id, req.body);
    res.json(result);
  } catch (e) { next(e); }
};


module.exports = exports;

