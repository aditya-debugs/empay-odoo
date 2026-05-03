const service = require('./payslip-disputes.service');

exports.getMyDisputes = async (req, res, next) => {
  try {
    const result = await service.getMyDisputes(req.user.id);
    res.json(result);
  } catch (e) { next(e); }
};

exports.raiseDispute = async (req, res, next) => {
  try {
    const result = await service.raiseDispute(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.getQueue = async (req, res, next) => {
  try {
    const result = await service.getDisputeQueue(req.user.role);
    res.json(result);
  } catch (e) { next(e); }
};

exports.resolve = async (req, res, next) => {
  try {
    const result = await service.resolveDispute(req.params.id, req.user.id, req.user.role, req.body);
    res.json(result);
  } catch (e) { next(e); }
};

module.exports = exports;
