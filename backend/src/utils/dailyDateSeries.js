'use strict';

const parseDateOnly = (value, label) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    throw new Error(`${label} must use YYYY-MM-DD format`);
  }
  const [year, month, day] = String(value).split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error(`${label} is not a valid calendar date`);
  }
  return parsed;
};

const startOfUtcMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

const endOfUtcMonth = (date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999));

const resolveDailyRange = ({ startDate, endDate } = {}, now = new Date()) => {
  const parsedStart = startDate ? parseDateOnly(startDate, 'startDate') : null;
  const parsedEnd = endDate ? parseDateOnly(endDate, 'endDate') : null;
  const anchor = parsedStart || parsedEnd || now;
  const start = parsedStart || startOfUtcMonth(anchor);
  const end = parsedEnd
    ? new Date(parsedEnd.getTime() + (24 * 60 * 60 * 1000) - 1)
    : endOfUtcMonth(anchor);

  if (start.getTime() > end.getTime()) {
    throw new Error('startDate must be on or before endDate');
  }
  return { start, end };
};

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

const fillDailySeries = (rows, range) => {
  const byDay = new Map((rows || []).map((row) => [dateKey(row.month), row]));
  const filled = [];
  const endDay = new Date(Date.UTC(
    range.end.getUTCFullYear(),
    range.end.getUTCMonth(),
    range.end.getUTCDate()
  ));

  for (
    let day = new Date(Date.UTC(
      range.start.getUTCFullYear(),
      range.start.getUTCMonth(),
      range.start.getUTCDate()
    ));
    day <= endDay;
    day.setUTCDate(day.getUTCDate() + 1)
  ) {
    const key = dateKey(day);
    const row = byDay.get(key);
    filled.push({
      month: key,
      total: Number(row?.total || 0),
      completed: Number(row?.completed || 0)
    });
  }
  return filled;
};

module.exports = { fillDailySeries, parseDateOnly, resolveDailyRange };
