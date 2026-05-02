/**
 * One-shot generator for API slice skeletons.
 * Run once: node scripts/gen-slice-stubs.js
 * Safe to delete after the slices have real controllers/services.
 */
const fs = require('fs');
const path = require('path');

const slices = {
  users: [
    ['POST',   '/',                   true, ['ADMIN'], 'Create user (admin creates HR/Payroll/Employee)'],
    ['GET',    '/',                   true, ['ADMIN'], 'List users with filters'],
    ['GET',    '/:id',                true, ['ADMIN'], 'Get user'],
    ['PATCH',  '/:id',                true, ['ADMIN'], 'Update user'],
    ['PATCH',  '/:id/deactivate',     true, ['ADMIN'], 'Soft delete user'],
    ['DELETE', '/:id',                true, ['ADMIN'], 'Hard delete user'],
    ['PATCH',  '/:id/reset-password', true, ['ADMIN'], 'Reset user credentials'],
    ['PATCH',  '/:id/change-role',    true, ['ADMIN'], 'Change user role'],
  ],
  employees: [
    ['POST',   '/',                     true, ['ADMIN', 'HR_OFFICER'], 'Create employee (HR-restricted creation)'],
    ['GET',    '/',                     true, [], 'List employees with search/filter'],
    ['GET',    '/:id',                  true, [], 'Get employee profile'],
    ['PATCH',  '/:id',                  true, ['ADMIN', 'HR_OFFICER'], 'Edit employee'],
    ['POST',   '/:id/avatar',           true, [], 'Upload avatar (self or admin/hr)'],
    ['POST',   '/:id/send-credentials', true, ['ADMIN', 'HR_OFFICER'], 'Resend login credentials email'],
  ],
  attendance: [
    ['POST',  '/check-in',     true, ['EMPLOYEE'], 'Employee check-in'],
    ['POST',  '/check-out',    true, ['EMPLOYEE'], 'Employee check-out'],
    ['GET',   '/me',           true, ['EMPLOYEE'], 'My attendance history'],
    ['GET',   '/',             true, ['ADMIN', 'HR_OFFICER'], 'List attendance (filters, daily/weekly/monthly)'],
    ['GET',   '/monthly',      true, ['ADMIN', 'HR_OFFICER'], 'Monthly attendance summary'],
    ['GET',   '/:employeeId',  true, ['ADMIN', 'HR_OFFICER'], 'Specific employee attendance'],
    ['PATCH', '/:id/override', true, ['ADMIN'], 'Manual override'],
    ['GET',   '/:id/audit',    true, ['ADMIN'], 'Override audit trail'],
  ],
  leave: [
    ['POST',  '/apply',        true, ['EMPLOYEE'], 'Apply for leave'],
    ['GET',   '/me',           true, ['EMPLOYEE'], 'My leave history'],
    ['GET',   '/queue',        true, ['ADMIN', 'HR_OFFICER'], 'Shared leave queue'],
    ['PATCH', '/:id/approve',  true, ['ADMIN', 'HR_OFFICER'], 'Approve leave'],
    ['PATCH', '/:id/reject',   true, ['ADMIN', 'HR_OFFICER'], 'Reject leave'],
    ['POST',  '/policies',     true, ['ADMIN'], 'Configure leave policy'],
    ['PATCH', '/balance',      true, ['ADMIN', 'HR_OFFICER'], 'Adjust leave balance / allocation'],
  ],
  payroll: [
    ['POST',  '/process',     true, ['PAYROLL_OFFICER'], 'Process payroll for a month'],
    ['GET',   '/preview',     true, ['PAYROLL_OFFICER', 'ADMIN'], 'Preview payroll'],
    ['GET',   '/:month',      true, ['PAYROLL_OFFICER', 'ADMIN'], 'View processed payroll'],
    ['PATCH', '/:id/reopen',  true, ['ADMIN'], 'Reopen processed payroll'],
    ['PATCH', '/:id/bonus',   true, ['ADMIN'], 'Adjust bonus'],
  ],
  payslips: [
    ['GET',  '/',                 true, ['PAYROLL_OFFICER', 'ADMIN'], 'List payslips'],
    ['GET',  '/me',               true, ['EMPLOYEE'], 'My payslips'],
    ['GET',  '/:id',              true, [], 'Get payslip (self or admin/payroll)'],
    ['POST', '/:id/generate-pdf', true, ['PAYROLL_OFFICER', 'ADMIN'], 'Generate PDF for a payslip'],
    ['POST', '/:id/reissue',      true, ['ADMIN', 'PAYROLL_OFFICER'], 'Reissue revised payslip'],
  ],
  'payslip-disputes': [
    ['POST',  '/',             true, ['EMPLOYEE'], 'Raise dispute'],
    ['GET',   '/me',           true, ['EMPLOYEE'], 'My disputes'],
    ['GET',   '/',             true, ['ADMIN', 'PAYROLL_OFFICER'], 'Dispute queue'],
    ['PATCH', '/:id/resolve',  true, ['PAYROLL_OFFICER', 'ADMIN'], 'Resolve dispute'],
    ['PATCH', '/:id/reissue',  true, ['PAYROLL_OFFICER', 'ADMIN'], 'Trigger revised payslip'],
    ['PATCH', '/:id/reject',   true, ['PAYROLL_OFFICER', 'ADMIN'], 'Reject dispute'],
  ],
  dashboard: [
    ['GET', '/admin/summary',    true, ['ADMIN'], 'Admin dashboard summary'],
    ['GET', '/admin/attendance', true, ['ADMIN'], 'Admin attendance analytics'],
    ['GET', '/admin/payroll',    true, ['ADMIN'], 'Admin payroll analytics'],
    ['GET', '/admin/headcount',  true, ['ADMIN'], 'Department headcount'],
    ['GET', '/admin/activity',   true, ['ADMIN'], 'Recent activity feed'],
    ['GET', '/hr',               true, ['HR_OFFICER'], 'HR dashboard'],
    ['GET', '/payroll',          true, ['PAYROLL_OFFICER'], 'Payroll dashboard'],
    ['GET', '/employee',         true, ['EMPLOYEE'], 'Employee dashboard'],
  ],
  settings: [
    ['GET',   '/',           true, ['ADMIN'], 'Get settings'],
    ['PATCH', '/company',    true, ['ADMIN'], 'Update company settings'],
    ['PATCH', '/attendance', true, ['ADMIN'], 'Update attendance settings'],
    ['PATCH', '/payroll',    true, ['ADMIN'], 'Update payroll settings'],
    ['PATCH', '/leave',      true, ['ADMIN'], 'Update leave settings'],
    ['POST',  '/holidays',   true, ['ADMIN'], 'Create/update holiday'],
  ],
  reports: [
    ['GET', '/attendance', true, ['ADMIN', 'PAYROLL_OFFICER'], 'Attendance report'],
    ['GET', '/leave',      true, ['ADMIN', 'HR_OFFICER'], 'Leave report'],
    ['GET', '/payroll',    true, ['ADMIN', 'PAYROLL_OFFICER'], 'Payroll report'],
    ['GET', '/headcount',  true, ['ADMIN', 'HR_OFFICER'], 'Headcount report'],
    ['GET', '/pf',         true, ['ADMIN', 'PAYROLL_OFFICER'], 'PF report'],
    ['GET', '/prof-tax',   true, ['ADMIN', 'PAYROLL_OFFICER'], 'Professional tax report'],
    ['GET', '/ytd',        true, ['ADMIN', 'PAYROLL_OFFICER'], 'YTD report'],
  ],
};

const root = path.resolve(__dirname, '..', 'src/api/v1');

function buildRoutesFile(name, routes) {
  const lines = [];
  lines.push(`const { Router } = require('express');`);
  lines.push(`const { requireAuth, requireRole } = require('../../../middleware/auth');`);
  lines.push('');
  lines.push(`const router = Router();`);
  lines.push('');
  lines.push(`// TODO — Implement controllers in ${name}.controller.js / .service.js,`);
  lines.push(`//        validation in ${name}.validation.js, then replace \`todo\` below.`);
  lines.push('');
  for (const [method, p, auth, roles, label] of routes) {
    const mws = [];
    if (auth) mws.push('requireAuth');
    if (roles && roles.length) mws.push(`requireRole(${roles.map((r) => `'${r}'`).join(', ')})`);
    const mwStr = mws.length ? mws.join(', ') + ', ' : '';
    const rolesNote = roles && roles.length ? ` [${roles.join(', ')}]` : '';
    lines.push(`// ${method} ${p} — ${label}${rolesNote}`);
    lines.push(`router.${method.toLowerCase()}('${p}', ${mwStr}todo);`);
    lines.push('');
  }
  lines.push(`function todo(_req, res) {`);
  lines.push(`  res.status(501).json({ message: 'Not implemented yet' });`);
  lines.push(`}`);
  lines.push('');
  lines.push(`module.exports = router;`);
  lines.push('');
  return lines.join('\n');
}

const controllerStub = (name) =>
  `// TODO — Implement controllers for the ${name} slice.\n` +
  `// Each controller should call into ./${name}.service.js and forward errors via next(err).\n` +
  `module.exports = {};\n`;

const serviceStub = (name) =>
  `// TODO — Implement business logic for the ${name} slice.\n` +
  `// Use the Prisma client from server/src/config/prisma.js.\n` +
  `module.exports = {};\n`;

const validationStub = (name) =>
  `const { z } = require('zod');\n\n` +
  `// TODO — Define Zod schemas for the ${name} slice.\n\n` +
  `module.exports = {};\n`;

let count = 0;
for (const [name, routes] of Object.entries(slices)) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.routes.js`), buildRoutesFile(name, routes));
  fs.writeFileSync(path.join(dir, `${name}.controller.js`), controllerStub(name));
  fs.writeFileSync(path.join(dir, `${name}.service.js`), serviceStub(name));
  fs.writeFileSync(path.join(dir, `${name}.validation.js`), validationStub(name));
  count++;
}
console.log(`Generated ${count} slice skeletons under src/api/v1/`);
