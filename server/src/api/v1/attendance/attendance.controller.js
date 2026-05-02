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

module.exports = exports;

