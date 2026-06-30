export function parseOrderHour(raw: string): number {
  let h = -1;
  if (/^\d{1,2}:\d{2}\s?(AM|PM)/i.test(raw)) {
    const m = raw.match(/^(\d{1,2}):\d{2}\s?(AM|PM)/i);
    if (m) {
      let hour = parseInt(m[1]);
      const isPM = m[2].toUpperCase() === 'PM';
      if (isPM && hour !== 12) hour += 12;
      if (!isPM && hour === 12) hour = 0;
      h = hour;
    }
  } else {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) h = d.getHours();
  }
  return h;
}

export function hourlyRevenue(orders: any[]) {
  const hourly: Record<number, number> = {};
  for (let i = 7; i <= 23; i++) hourly[i] = 0;

  orders.forEach((o: any) => {
    const raw = o.createdAt || '';
    const h = parseOrderHour(raw);
    if (h >= 0) hourly[h] = (hourly[h] || 0) + (o.amount || 0);
  });

  return Object.entries(hourly).map(([h, val]) => {
    const hour = parseInt(h, 10);
    const label =
      hour === 0 ? '12AM' :
      hour < 12 ? `${hour}AM` :
      hour === 12 ? '12PM' :
      `${hour - 12}PM`;
    return { label, value: val };
  });
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fallbackRevenue = [8200, 10500, 9800, 11200, 11800, 14250, 12450];
const fallbackOrders = [38, 42, 40, 48, 52, 68, 55];

function getOrderDay(raw: string): number | null {
  const d = new Date(raw);
  if (!isNaN(d.getTime())) return d.getDay();
  if (/^\d{1,2}:\d{2}\s?(AM|PM)/i.test(raw)) return new Date().getDay();
  return null;
}

export function weeklyRevenue(orders: any[]) {
  const dayRevenue: Record<string, number> = {};
  weekDays.forEach(d => dayRevenue[d] = 0);

  orders.forEach((o: any) => {
    const raw = o.createdAt || '';
    const dayIndex = getOrderDay(raw);
    if (dayIndex !== null) {
      const day = weekDays[(dayIndex + 6) % 7];
      dayRevenue[day] = (dayRevenue[day] || 0) + (o.amount || 0);
    }
  });

  const hasData = Object.values(dayRevenue).some(v => v > 0);
  if (!hasData && orders.length === 0) {
    return weekDays.map((day, i) => ({ label: day, value: fallbackRevenue[i] }));
  }

  return weekDays.map(day => ({ label: day, value: dayRevenue[day] }));
}

export function weeklyOrders(orders: any[]) {
  const dayCount: Record<string, number> = {};
  weekDays.forEach(d => dayCount[d] = 0);

  orders.forEach((o: any) => {
    const raw = o.createdAt || '';
    const dayIndex = getOrderDay(raw);
    if (dayIndex !== null) {
      const day = weekDays[(dayIndex + 6) % 7];
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
  });

  const hasData = Object.values(dayCount).some(v => v > 0);
  if (!hasData && orders.length === 0) {
    return weekDays.map((day, i) => ({ label: day, value: fallbackOrders[i] }));
  }

  return weekDays.map(day => ({ label: day, value: dayCount[day] }));
}
