const service = require('./leave.service');

exports.applyLeave = async (req, res, next) => {
  try {
    const leave = await service.applyLeave(req.user.id, req.body);
    res.status(201).json({ message: 'Leave request submitted', leave });
  } catch (e) { next(e); }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const result = await service.getLeaveHistory(req.user.id, parseInt(limit), parseInt(offset));
    res.json(result);
  } catch (e) { next(e); }
};

exports.getBalance = async (req, res, next) => {
  try {
    const balances = await service.getLeaveBalance(req.user.id);
    res.json({ balances });
  } catch (e) { next(e); }
};

module.exports = exports;

