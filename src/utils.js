// Get ISO week number for a date
function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setUTCMonth(0, 1);
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000);
  return `${target.getUTCFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

// Get the start of the week (Monday) for a date
function getWeekStart(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr);
  target.setUTCHours(0, 0, 0, 0);
  return target.toISOString().split('T')[0];
}

// Get the end of the week (Sunday) for a date
function getWeekEnd(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 6);
  target.setUTCHours(23, 59, 59, 999);
  return target.toISOString().split('T')[0];
}

export { getISOWeek, getWeekStart, getWeekEnd };