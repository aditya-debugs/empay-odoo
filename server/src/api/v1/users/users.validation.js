const { z } = require('zod');

const ROLE = z.enum(['EMPLOYEE', 'HR_OFFICER', 'PAYROLL_OFFICER', 'ADMIN']);
const EMPLOYMENT_TYPE = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT']);
const GENDER = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional();

// Loose date — accepts ISO date strings; rejects nonsense
const DATE = z.string().min(1).refine((s) => !Number.isNaN(Date.parse(s)), 'Invalid date');

const optionalNum = z.union([z.number(), z.string().transform(Number)]).optional().nullable();
const requiredNum = z.union([z.number(), z.string().transform(Number)]);

exports.createUserSchema = z.object({
  // Personal
  firstName:     z.string().min(1, 'First name is required'),
  lastName:      z.string().min(1, 'Last name is required'),
  gender:        GENDER,
  dob:           DATE.optional().nullable(),
  personalEmail: z.email().optional().or(z.literal('').transform(() => undefined)),
  personalPhone: z.string().optional().nullable(),
  avatarUrl:     z.string().optional().nullable(),

  // Employment
  workEmail:      z.email('Invalid work email'),
  department:     z.string().min(1, 'Department is required'),
  position:       z.string().min(1, 'Position is required'),
  joinDate:       DATE,
  employmentType: EMPLOYMENT_TYPE.default('FULL_TIME'),
  role:           ROLE,

  // Salary
  basicSalary:      requiredNum,
  hra:              optionalNum,
  conveyance:       optionalNum,
  specialAllowance: optionalNum,
  otherAllowance:   optionalNum,
  pfEnabled:        z.boolean().default(true),
  pfPercent:        optionalNum,
  professionalTax:  optionalNum,

  // Bank
  bankName:      z.string().optional().nullable(),
  bankBranch:    z.string().optional().nullable(),
  bankAccountNo: z.string().optional().nullable(),
  bankIfsc:      z.string().optional().nullable(),
});

exports.changeRoleSchema = z.object({
  role: ROLE,
});
