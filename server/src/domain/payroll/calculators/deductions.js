function calculatePF(basic) {
  return basic * 0.12;
}

function calculateESIC(gross) {
  return gross <= 21000 ? gross * 0.0075 : 0;
}

function calculateTDS(basic) {
  const annual = basic * 12;
  let annualTds = 0;
  
  if (annual > 1000000) {
    annualTds += (annual - 1000000) * 0.30;
    annualTds += 500000 * 0.20; // 5L to 10L
    annualTds += 250000 * 0.05; // 2.5L to 5L
  } else if (annual > 500000) {
    annualTds += (annual - 500000) * 0.20;
    annualTds += 250000 * 0.05;
  } else if (annual > 250000) {
    annualTds += (annual - 250000) * 0.05;
  }
  
  return annualTds / 12;
}

function calculateProfTax(gross) {
  if (gross <= 7500) return 0;
  if (gross <= 10000) return 175;
  return 200;
}

function calculateOvertimeBonus({ overtimeHours, basic, workingDays, hoursPerDay = 8 }) {
  if (!overtimeHours || overtimeHours <= 0) return 0;
  const hourlyRate = basic / (workingDays * hoursPerDay);
  return overtimeHours * hourlyRate;
}

module.exports = {
  calculatePF,
  calculateESIC,
  calculateTDS,
  calculateProfTax,
  calculateOvertimeBonus
};
