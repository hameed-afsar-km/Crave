export function parseOrderDate(raw: string): Date | null {
  if (/^\d{1,2}:\d{2}\s?(AM|PM)/i.test(raw)) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

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
  const d = parseOrderDate(raw);
  if (d) return d.getDay();
  return null;
}

function getOrderDate(raw: string): Date | null {
  return parseOrderDate(raw);
}

export function weeklyRevenue(orders: any[]) {
  const dayRevenue: Record<string, number> = {};
  weekDays.forEach(d => dayRevenue[d] = 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const filtered = orders.filter((o: any) => {
    const d = getOrderDate(o.createdAt || '');
    return d && d >= weekStart && d < weekEnd;
  });

  filtered.forEach((o: any) => {
    const raw = o.createdAt || '';
    const dayIndex = getOrderDay(raw);
    if (dayIndex !== null) {
      const day = weekDays[(dayIndex + 6) % 7];
      dayRevenue[day] = (dayRevenue[day] || 0) + (o.amount || 0);
    }
  });

  const hasData = Object.values(dayRevenue).some(v => v > 0);
  if (!hasData && orders.length > 0) {
    orders.forEach((o: any) => {
      const raw = o.createdAt || '';
      const dayIndex = getOrderDay(raw);
      if (dayIndex !== null) {
        const day = weekDays[(dayIndex + 6) % 7];
        dayRevenue[day] = (dayRevenue[day] || 0) + (o.amount || 0);
      }
    });
  }

  const totalRevenue = Object.values(dayRevenue).reduce((s, v) => s + v, 0);
  if (totalRevenue === 0 && orders.length === 0) {
    return weekDays.map((day, i) => ({ label: day, value: fallbackRevenue[i] }));
  }

  return weekDays.map(day => ({ label: day, value: dayRevenue[day] }));
}

export function weeklyOrders(orders: any[]) {
  const dayCount: Record<string, number> = {};
  weekDays.forEach(d => dayCount[d] = 0);

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const filtered = orders.filter((o: any) => {
    const d = getOrderDate(o.createdAt || '');
    return d && d >= weekStart && d < weekEnd;
  });

  filtered.forEach((o: any) => {
    const raw = o.createdAt || '';
    const dayIndex = getOrderDay(raw);
    if (dayIndex !== null) {
      const day = weekDays[(dayIndex + 6) % 7];
      dayCount[day] = (dayCount[day] || 0) + 1;
    }
  });

  const hasData = Object.values(dayCount).some(v => v > 0);
  if (!hasData && orders.length > 0) {
    orders.forEach((o: any) => {
      const raw = o.createdAt || '';
      const dayIndex = getOrderDay(raw);
      if (dayIndex !== null) {
        const day = weekDays[(dayIndex + 6) % 7];
        dayCount[day] = (dayCount[day] || 0) + 1;
      }
    });
  }

  if (Object.values(dayCount).reduce((s, v) => s + v, 0) === 0 && orders.length === 0) {
    return weekDays.map((day, i) => ({ label: day, value: fallbackOrders[i] }));
  }

  return weekDays.map(day => ({ label: day, value: dayCount[day] }));
}

export function monthWeekRevenue(orders: any[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const weeks: { label: string; start: Date; end: Date }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let cursor = new Date(firstDay);

  while (cursor <= lastDay) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekNum = weeks.length + 1;
    weeks.push({
      label: `W${weekNum}`,
      start: weekStart,
      end: weekEnd > lastDay ? lastDay : weekEnd,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  const monthOrders = orders.filter((o: any) => {
    const d = getOrderDate(o.createdAt || '');
    return d && d.getMonth() === month && d.getFullYear() === year;
  });

  return weeks.map(w => {
    const total = monthOrders
      .filter((o: any) => {
        const d = getOrderDate(o.createdAt || '');
        return d && d >= w.start && d <= w.end;
      })
      .reduce((s: number, o: any) => s + (o.amount || 0), 0);
    return { label: w.label, value: total };
  });
}

export function monthWeekOrders(orders: any[]) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const weeks: { label: string; start: Date; end: Date }[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let cursor = new Date(firstDay);

  while (cursor <= lastDay) {
    const weekStart = new Date(cursor);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    const weekNum = weeks.length + 1;
    weeks.push({
      label: `W${weekNum}`,
      start: weekStart,
      end: weekEnd > lastDay ? lastDay : weekEnd,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  const monthOrders = orders.filter((o: any) => {
    const d = getOrderDate(o.createdAt || '');
    return d && d.getMonth() === month && d.getFullYear() === year;
  });

  return weeks.map(w => {
    const count = monthOrders.filter((o: any) => {
      const d = getOrderDate(o.createdAt || '');
      return d && d >= w.start && d <= w.end;
    }).length;
    return { label: w.label, value: count };
  });
}

export function filterOrdersByPeriod(orders: any[], period: 'weekly' | 'monthly') {
  const now = new Date();

  if (period === 'weekly') {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return orders.filter((o: any) => {
      const d = getOrderDate(o.createdAt || '');
      return d && d >= weekStart && d < weekEnd;
    });
  }

  const month = now.getMonth();
  const year = now.getFullYear();
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);
  return orders.filter((o: any) => {
    const d = getOrderDate(o.createdAt || '');
    return d && d >= monthStart && d < monthEnd;
  });
}
