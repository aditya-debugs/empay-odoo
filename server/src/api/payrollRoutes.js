const { Router } = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const service = require('../services/payrollService');

const router = Router();

router.use(requireAuth);

router.get('/dashboard', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const repository = require('../repositories/payrollRepository');
  try {
    const data = await repository.getPayrollDashboardData();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/payroll/dashboard', async (req, res, next) => {
  try { res.json(await service.getDashboardStats(req.user)); } catch (e) { next(e); }
});

router.get('/payroll/preview', async (req, res, next) => {
  try { res.json(await service.previewPayroll(req.query.month, req.user)); } catch (e) { next(e); }
});

router.post('/payroll/process', async (req, res, next) => {
  try { res.json(await service.processPayroll(req.body.month, req.user)); } catch (e) { next(e); }
});

router.get('/payroll/:month', async (req, res, next) => {
  const repository = require('../repositories/payrollRepository');
  try { res.json(await repository.getPayrollByMonth(req.params.month)); } catch (e) { next(e); }
});

router.get('/payslips', async (req, res, next) => {
  try {
    const filters = {};
    if (req.query.month) filters.month = parseInt(req.query.month, 10);
    if (req.query.year) filters.year = parseInt(req.query.year, 10);
    if (req.query.employeeId) filters.employeeId = req.query.employeeId;
    if (req.query.search) {
      filters.employee = {
        OR: [
          { firstName: { contains: req.query.search, mode: 'insensitive' } },
          { lastName: { contains: req.query.search, mode: 'insensitive' } }
        ]
      };
    }
    res.json(await service.getPayslips(filters, req.user));
  } catch (e) { next(e); }
});

router.get('/payslips/draft', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const { employeeId, month } = req.query;
  const repository = require('../repositories/payrollRepository');
  try {
    const data = await repository.getDraftPayslip(employeeId, month);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/payslips/:id', async (req, res, next) => {
  try { res.json(await service.getPayslipById(req.params.id, req.user)); } catch (e) { next(e); }
});

router.post('/payslips/:id/generate-pdf', async (req, res, next) => {
  try { res.json(await service.generatePDF(req.params.id, req.user)); } catch (e) { next(e); }
});

router.post('/payslip-disputes', async (req, res, next) => {
  try { res.json(await service.raiseDispute(req.body.payslipId, req.body.reason, req.user)); } catch (e) { next(e); }
});

router.get('/payslip-disputes', async (req, res, next) => {
  try { res.json(await service.getDisputes(req.query, req.user)); } catch (e) { next(e); }
});

router.patch('/payslip-disputes/:id/resolve', async (req, res, next) => {
  try { res.json(await service.resolveDispute(req.params.id, 'RESOLVE', req.body.note, req.user)); } catch (e) { next(e); }
});

router.patch('/payslip-disputes/:id/reissue', async (req, res, next) => {
  try { res.json(await service.resolveDispute(req.params.id, 'REISSUE', req.body.note, req.user)); } catch (e) { next(e); }
});

router.patch('/payslip-disputes/:id/reject', async (req, res, next) => {
  try { res.json(await service.resolveDispute(req.params.id, 'REJECT', req.body.note, req.user)); } catch (e) { next(e); }
});

router.get('/reports/payroll', async (req, res, next) => {
  try { res.json(await service.getReport('payroll', req.query, req.user)); } catch (e) { next(e); }
});

router.get('/reports/pf', async (req, res, next) => {
  try { res.json(await service.getReport('pf', req.query, req.user)); } catch (e) { next(e); }
});

router.get('/reports/prof-tax', async (req, res, next) => {
  try { res.json(await service.getReport('prof-tax', req.query, req.user)); } catch (e) { next(e); }
});

router.get('/reports/ytd', async (req, res, next) => {
  try { res.json(await service.getReport('ytd', req.query, req.user)); } catch (e) { next(e); }
});

router.get('/payrun-summary', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ error: 'month required' });
  const repository = require('../repositories/payrollRepository');
  try {
    const data = await repository.getPayrunSummary(month);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/validate', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'month required' });
  const repository = require('../repositories/payrollRepository');
  try {
    const result = await repository.validatePayrun(month);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/payslips/:id/compute', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const repository = require('../repositories/payrollRepository');
  try {
    const data = await repository.getPayslipById(req.params.id);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/payslips/:id/validate', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const repository = require('../repositories/payrollRepository');
  try {
    const result = await repository.validatePayslip(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/payslips/:id/cancel', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const repository = require('../repositories/payrollRepository');
  try {
    const result = await repository.cancelPayslip(req.params.id);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



module.exports = router;
