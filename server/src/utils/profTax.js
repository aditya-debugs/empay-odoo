// Professional Tax slabs by Indian state.
// Returns the monthly PT amount for the given gross salary.
//
// To add a state: add a function (gross, isFebruary) => number to SLABS.

const SLABS = {
  MAHARASHTRA: (gross, isFebruary) => {
    if (gross <= 7500) return 0;
    if (gross <= 10000) return 175;
    return isFebruary ? 300 : 200;
  },
  KARNATAKA: (gross) => (gross > 15000 ? 200 : 0),
  // Tamil Nadu — half-yearly slabs simplified to a monthly approximation
  TAMIL_NADU: (gross) => {
    if (gross <= 21000) return 0;
    if (gross <= 30000) return 100;
    if (gross <= 45000) return 235;
    if (gross <= 60000) return 510;
    if (gross <= 75000) return 760;
    return 1095;
  },
  GUJARAT: (gross) => {
    if (gross < 12000) return 0;
    return 200;
  },
  WEST_BENGAL: (gross) => {
    if (gross <= 10000) return 0;
    if (gross <= 15000) return 110;
    if (gross <= 25000) return 130;
    if (gross <= 40000) return 150;
    return 200;
  },
  DELHI: () => 0,
};

const SUPPORTED_STATES = Object.keys(SLABS);

function computeProfTax(state, gross, month /* 1-12 */) {
  const slab = SLABS[state];
  if (!slab) return 0;
  return slab(Number(gross || 0), month === 2);
}

module.exports = { computeProfTax, SUPPORTED_STATES };
