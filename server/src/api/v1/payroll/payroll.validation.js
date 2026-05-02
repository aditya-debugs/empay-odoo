const { z } = require('zod');

const intLike = z.union([z.number(), z.string().transform(Number)]);
const numOpt  = z.union([z.number(), z.string().transform(Number)]).optional().nullable();

const adjustmentSchema = z.object({
  employeeId:      z.string().min(1),
  paidDays:        numOpt,
  lopDays:         numOpt,
  bonus:           numOpt,
  tds:             numOpt,
  customDeduction: numOpt,
});

exports.processSchema = z.object({
  month:        intLike,
  year:         intLike,
  adjustments:  z.array(adjustmentSchema).optional(),
});

exports.previewQuerySchema = z.object({
  month: intLike,
  year:  intLike,
});
