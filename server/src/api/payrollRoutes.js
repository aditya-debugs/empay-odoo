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
    console.error('[PayrollDashboard Error]:', e);
    res.status(500).json({ error: e.message });
  }
});

router.get('/payroll/dashboard', async (req, res, next) => {
  try { res.json(await service.getDashboardStats(req.user)); } catch (e) { next(e); }
});

router.get('/payroll/preview', async (req, res, next) => {
  try {
    // Client sends ?month=05&year=2026 as separate params — build YYYY-MM string
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ error: 'month and year query params are required' });
    const monthStr = `${year}-${String(month).padStart(2, '0')}`;
    res.json(await service.previewPayroll(monthStr, req.user));
  } catch (e) { next(e); }
});

router.post('/payroll/process', async (req, res, next) => {
  try {
    // Body may send { month: 5, year: 2026 } (integers) or { month: "2026-05" }
    const { month, year } = req.body;
    const monthStr = (year && month && !String(month).includes('-'))
      ? `${year}-${String(month).padStart(2, '0')}`
      : String(month);
    res.json(await service.processPayroll(monthStr, req.user));
  } catch (e) { next(e); }
});

router.post('/payroll/process-individual', async (req, res, next) => {
  try { res.json(await service.processIndividualPayroll(req.body.employeeId, req.body.month, req.user)); } catch (e) { next(e); }
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
    const data = await repository.recomputePayslip(req.params.id);
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

const { generatePayslipPDF } = require('../templates/payslipTemplate');

router.get('/payslips/:id/pdf', requireRole('PAYROLL_OFFICER', 'ADMIN', 'EMPLOYEE'), async (req, res) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id },
      include: { employee: true }
    });
    if (!payslip) return res.status(404).json({ error: 'Payslip not found' });

    if (req.user.role === 'EMPLOYEE' && payslip.employeeId !== req.user.employeeId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { filePath, filename } = await generatePayslipPDF(payslip);
    res.download(filePath, filename);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.patch('/payslips/:id/cancel', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  try {
    const payslip = await prisma.payslip.findUnique({
      where: { id: req.params.id }
    });
    if (!payslip) return res.status(404).json({ error: 'Payslip not found' });

    if (payslip.status === 'GENERATED') {
      return res.status(423).json({ error: 'Cannot cancel a validated payslip' });
    }

    if (payslip.status === 'CANCELLED') {
      return res.status(400).json({ error: 'Payslip is already cancelled' });
    }

    const updated = await prisma.payslip.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' }
    });

    res.json(updated);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/payslips/new', requireRole('PAYROLL_OFFICER', 'ADMIN'), async (req, res) => {
  const { employeeId, month } = req.body;
  if (!employeeId || !month) return res.status(400).json({ error: 'employeeId and month required' });

  try {
    const [year, mInt] = month.split('-').map(Number);

    const existing = await prisma.payslip.findFirst({
      where: { employeeId, month: mInt, year }
    });
    if (existing) return res.status(409).json({ error: `A payslip already exists for ${month}` });

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) return res.status(404).json({ error: 'Employee not found' });

    const payslip = await prisma.payslip.create({
      data: {
        employeeId, month: mInt, year, version: 1,
        basicSalary: Number(employee.basicSalary || 0),
        grossSalary: 0, totalDeductions: 0, netSalary: 0, status: 'DRAFT'
      }
    });

    res.status(201).json({ payslipId: payslip.id });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
