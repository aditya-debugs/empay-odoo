const prisma = require('../config/prisma');

// Login ID format per the mockup spec:
// [Company prefix (2)][First name (2) + Last name (2)][Year (4)][Serial (4)]
// Example: "Odoo India" + "John Doe" + 2022 + 1 → "OIJODO20220001"

function getCompanyPrefix(name) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'XX';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase().padEnd(2, 'X');
  return (words[0][0] + words[1][0]).toUpperCase();
}

async function generateLoginId({ companyName, firstName, lastName, joinDate }) {
  const co = getCompanyPrefix(companyName);
  const initials = (
    (firstName.slice(0, 2) || 'XX') + (lastName.slice(0, 2) || 'XX')
  ).toUpperCase();
  const date = new Date(joinDate);
  const year = date.getFullYear();

  // Serial = (employees joined in same year) + 1
  const yearStart = new Date(year, 0, 1);
  const yearEnd   = new Date(year + 1, 0, 1);
  const count = await prisma.employee.count({
    where: { joinDate: { gte: yearStart, lt: yearEnd } },
  });
  const serial = String(count + 1).padStart(4, '0');

  return `${co}${initials}${year}${serial}`;
}

// Avoids easily-confused chars (no 0/O, 1/l/I)
function generateTempPassword(length = 8) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let pwd = '';
  for (let i = 0; i < length; i++) {
    pwd += chars[Math.floor(Math.random() * chars.length)];
  }
  return pwd;
}

module.exports = { generateLoginId, generateTempPassword, getCompanyPrefix };
