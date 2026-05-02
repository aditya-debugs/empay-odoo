const { z } = require('zod');

const num = z.union([z.number(), z.string().transform(Number)]).optional();
const bool = z.boolean().optional();
const str = z.string().optional().nullable();

exports.updateSettingsSchema = z.object({
  // Company
  companyName:    str,
  companyAddress: str,
  cin:            str,
  logoUrl:        str,

  // Financial / period
  fyStartMonth:        num,
  payDay:              num,
  workingDaysPerMonth: num,
  workingDaysPerWeek:  num,
  weeklyOff:           str,

  // HRA
  isMetro:            bool,
  metroHraPercent:    num,
  nonMetroHraPercent: num,

  // Allowances
  conveyanceDefault: num,
  medicalDefault:    num,

  // PF
  pfEnabled:         bool,
  pfBasicThreshold:  num,
  pfEmployeePercent: num,
  pfEmployerPercent: num,

  // ESIC
  esicEnabled:         bool,
  esicGrossThreshold:  num,
  esicEmployeePercent: num,
  esicEmployerPercent: num,

  // Prof tax
  profTaxState: str,

  // Attendance
  fullDayMinHours:      num,
  halfDayMinHours:      num,
  graceMinutes:         num,
  fullDayCheckInBefore: str,
  halfDayCheckInBefore: str,
});
