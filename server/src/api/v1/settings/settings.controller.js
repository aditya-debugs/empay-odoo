const service = require('./settings.service');

exports.get = async (_req, res, next) => {
  try {
    const settings = await service.getSettings();
    res.json({ settings, supportedStates: service.getSupportedStates() });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const settings = await service.updateSettings(req.body);
    res.json({ settings });
  } catch (e) { next(e); }
};
