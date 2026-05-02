function calculateLOP({ workingDays, presentDays, approvedLeaveDays, halfDays }) {
  const lop = workingDays - presentDays - approvedLeaveDays - (halfDays * 0.5);
  return lop < 0 ? 0 : lop;
}

module.exports = { calculateLOP };
