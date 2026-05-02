function calculateWorkingDays(monthStr, holidays = []) {
  const [year, month] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month - 1, i);
    const day = date.getDay(); // 0 is Sunday, 6 is Saturday
    
    // Check if weekend
    if (day === 0 || day === 6) continue;

    // Check if holiday
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    if (holidays.includes(dateStr)) continue;

    count++;
  }

  return count;
}

module.exports = { calculateWorkingDays };
