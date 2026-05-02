const service = require('./payroll.service');

exports.preview = async (req, res, next) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) {
      return res.status(400).json({ message: 'month and year query params are required' });
    }
    const adjustments = req.body?.adjustments || [];
    const result = await service.preview({ month, year, adjustments });
    res.json(result);
  } catch (e) { next(e); }
};

exports.process = async (req, res, next) => {
  try {
    const result = await service.process(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) { next(e); }
};

exports.listRuns = async (_req, res, next) => {
  try {
    const runs = await service.listRuns();
    res.json({ runs });
  } catch (e) { next(e); }
};

exports.getRun = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const version = req.query.version;
    const run = await service.getRun(year, month, version);
    res.json(run);
  } catch (e) { next(e); }
};
