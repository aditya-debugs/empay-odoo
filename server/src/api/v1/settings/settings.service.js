const prisma = require('../../../config/prisma');
const { SUPPORTED_STATES } = require('../../../utils/profTax');

// Singleton — there is exactly one settings row in the system.
async function getSettings() {
  let s = await prisma.orgSettings.findFirst();
  if (!s) {
    s = await prisma.orgSettings.create({ data: {} });
  }
  return s;
}

async function updateSettings(patch) {
  const current = await getSettings();
  const updated = await prisma.orgSettings.update({
    where: { id: current.id },
    data: patch,
  });
  return updated;
}

function getSupportedStates() {
  return SUPPORTED_STATES;
}

module.exports = { getSettings, updateSettings, getSupportedStates };
