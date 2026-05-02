const service = require('./employees.service');

exports.list = async (_req, res, next) => {
  try {
    const employees = await service.listEmployees();
    res.json({ employees });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const employee = await service.getEmployee(req.params.id);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    res.json({ employee });
  } catch (e) { next(e); }
};
