import express from 'express';
import crypto from 'node:crypto';
import { getDb, save, uid, hhmm, todayStr, shiftDate } from './store.js';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT || 4000);
const db = getDb();

const COLLECTIONS = ['branches', 'services', 'therapists', 'rooms', 'customers', 'bookings', 'gifts', 'payments', 'complaints', 'waitlist', 'inventory', 'users'];

const nowIso = () => new Date().toISOString();

/* ------------------------------- helpers -------------------------------- */

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const idx = part.indexOf('=');
        return [part.slice(0, idx), decodeURIComponent(part.slice(idx + 1))];
      }),
  );
}

function currentUser(req) {
  const token = parseCookies(req.headers.cookie).spa_session;
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  return db.users.find((u) => u.id === session.user_id) || null;
}

function requireAuth(req, res, next) {
  const user = currentUser(req);
  if (!user) return res.status(401).json({ error: 'auth_required' });
  req.user = user;
  next();
}

function startSession(res, user) {
  const token = crypto.randomBytes(24).toString('hex');
  db.sessions[token] = { user_id: user.id, created_at: nowIso() };
  save();
  res.setHeader(
    'Set-Cookie',
    `spa_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`,
  );
}

function bookingNumber() {
  const date = todayStr().replace(/-/g, '');
  let n = crypto.randomInt(1000, 9999);
  let code = `BK-${date}-${n}`;
  while (db.bookings.some((b) => b.booking_number === code)) {
    n = crypto.randomInt(1000, 9999);
    code = `BK-${date}-${n}`;
  }
  return code;
}

function giftCode() {
  let code = `GIFT-${crypto.randomInt(1000, 9999)}`;
  while (db.gifts.some((g) => g.gift_code === code)) code = `GIFT-${crypto.randomInt(1000, 9999)}`;
  return code;
}

const activeStatuses = ['scheduled', 'checked-in', 'in-session', 'completed', 'completed-unpaid', 'paid'];
const blockingStatuses = ['scheduled', 'checked-in', 'in-session'];

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

const minutesOf = (t) => {
  const [h, m] = String(t || '00:00').split(':').map(Number);
  return h * 60 + m;
};

function activeBookingsFor(date, branchId) {
  return db.bookings.filter(
    (b) => b.date === date && b.branch_id === branchId && blockingStatuses.includes(b.status),
  );
}

function computeAvailability({ serviceId, date, therapistId, branchId }) {
  const service = db.services.find((s) => s.id === serviceId);
  if (!service) return { slots: [], reason: 'الخدمة غير موجودة' };
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const bookings = activeBookingsFor(date, branchId);
  const dayBookings = db.bookings.filter(
    (b) => b.date === date && b.branch_id === branchId && activeStatuses.includes(b.status),
  );

  const therapists = db.therapists.filter(
    (t) =>
      t.branch_id === branchId &&
      !t.on_leave &&
      t.work_days.includes(weekday) &&
      t.service_ids.includes(serviceId) &&
      (!therapistId || t.id === therapistId),
  );

  const rooms = db.rooms.filter(
    (r) => r.branch_id === branchId && r.status !== 'maintenance' && r.service_ids.includes(serviceId),
  );

  const slots = [];
  for (const therapist of therapists) {
    for (let start = therapist.start_min; start + service.duration_minutes <= therapist.end_min; start += 15) {
      if (start < 540) continue;
      const end = start + service.duration_minutes;
      const therapistBusy = dayBookings.some(
        (b) =>
          b.therapist_id === therapist.id &&
          overlaps(start, end, b.start_min, b.end_min) &&
          b.status !== 'cancelled' &&
          b.status !== 'no-show',
      );
      if (therapistBusy) continue;
      const room = rooms.find(
        (r) =>
          !dayBookings.some(
            (b) =>
              b.room_id === r.id &&
              overlaps(start, end, b.start_min, b.end_min) &&
              b.status !== 'cancelled' &&
              b.status !== 'no-show',
          ),
      );
      if (!room) continue;
      slots.push({
        start_min: start,
        end_min: end,
        time: hhmm(start),
        therapist_id: therapist.id,
        therapist_name: therapist.name,
        room_id: room.id,
        room_name: room.name,
      });
    }
  }
  slots.sort((a, b) => a.start_min - b.start_min);
  return { slots: slots.slice(0, 60), bookings, reason: therapists.length ? '' : 'لا يوجد مختص مؤهل لهذه الخدمة اليوم' };
}

function roomStatusNow(branchId) {
  const today = todayStr();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  return db.rooms
    .filter((r) => r.branch_id === branchId)
    .map((room) => {
      const live = db.bookings.find(
        (b) =>
          b.room_id === room.id &&
          b.date === today &&
          b.status === 'in-session' &&
          nowMin >= b.start_min &&
          nowMin <= b.end_min,
      );
      const upcoming = db.bookings
        .filter((b) => b.room_id === room.id && b.date === today && b.status === 'scheduled' && b.start_min >= nowMin)
        .sort((a, b) => a.start_min - b.start_min)[0];
      const status = room.status === 'maintenance' ? 'maintenance' : live ? 'occupied' : upcoming ? 'reserved' : 'available';
      return { ...room, status, live_booking: live || null, upcoming_booking: upcoming || null };
    });
}

function addPayment(booking, amount, method, userName) {
  const value = Number(amount) || 0;
  if (value <= 0) return;
  const payment = {
    id: uid('pay'),
    branch_id: booking.branch_id,
    booking_id: booking.id,
    booking_number: booking.booking_number,
    customer_name: booking.customer_name,
    amount: value,
    method: method || 'cash',
    user_name: userName || '',
    created_at: nowIso(),
  };
  db.payments.unshift(payment);
  booking.paid_amount = Number(booking.paid_amount || 0) + value;
  if (booking.paid_amount >= booking.final_amount) booking.status = 'paid';
}

/* -------------------------------- auth ---------------------------------- */

app.post('/api/auth/demo', (req, res) => {
  const user = db.users[0];
  startSession(res, user);
  res.json({ user });
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const user = db.users.find((u) => u.email.toLowerCase() === email) || db.users[0];
  startSession(res, user);
  res.json({ user });
});

app.post('/api/auth/register', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'البريد الإلكتروني مطلوب' });
  let user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    user = {
      id: uid('us'),
      full_name: req.body?.full_name || email.split('@')[0],
      email,
      role: 'receptionist',
      branch_id: db.branches[0].id,
      notify_bookings: true,
      notify_late: true,
      notify_payments: true,
    };
    db.users.push(user);
    save();
  }
  startSession(res, user);
  res.json({ user });
});

app.post('/api/auth/logout', (req, res) => {
  const token = parseCookies(req.headers.cookie).spa_session;
  if (token) delete db.sessions[token];
  save();
  res.setHeader('Set-Cookie', 'spa_session=; Path=/; Max-Age=0');
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

app.patch('/api/auth/me', requireAuth, (req, res) => {
  Object.assign(req.user, req.body || {});
  save();
  res.json({ user: req.user });
});

app.get('/api/bootstrap', requireAuth, (req, res) => {
  res.json({ user: req.user, branches: db.branches, settings: db.settings });
});

/* ------------------------------- bookings ------------------------------- */

function createBooking(req, res) {
  const body = req.body || {};
  const service = db.services.find((s) => s.id === body.service_id);
  let therapist = db.therapists.find((t) => t.id === body.therapist_id);
  const start = Number(body.start_min);
  const date = body.date || todayStr();

  if (!service) return res.status(400).json({ error: 'يرجى اختيار الخدمة' });
  if (!Number.isFinite(start)) return res.status(400).json({ error: 'يرجى تحديد الوقت' });

  let customer = db.customers.find((c) => c.id === body.customer_id);
  if (!customer) {
    if (!body.customer_name) return res.status(400).json({ error: 'يرجى اختيار عميل أو إنشاء عميل جديد' });
    customer = {
      id: uid('cu'),
      branch_id: body.branch_id || req.user.branch_id,
      name: body.customer_name,
      phone: body.customer_phone || '',
      notes: '',
      created_at: nowIso(),
    };
    db.customers.push(customer);
  }

  const branchId = body.branch_id || req.user.branch_id;
  const end = start + service.duration_minutes;
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const dayBookings = db.bookings.filter(
    (b) => b.date === date && b.branch_id === branchId && b.status !== 'cancelled' && b.status !== 'no-show',
  );

  if (therapist) {
    if (!therapist.service_ids.includes(service.id)) {
      return res.status(400).json({ error: 'المختص غير مؤهل لهذه الخدمة' });
    }
    if (!therapist.work_days.includes(weekday)) {
      return res.status(400).json({ error: 'المختص لا يعمل في هذا اليوم' });
    }
    if (start < therapist.start_min || end > therapist.end_min) {
      return res.status(400).json({ error: `المختص يعمل من ${hhmm(therapist.start_min)} إلى ${hhmm(therapist.end_min)}` });
    }
    const busy = dayBookings.some((b) => b.therapist_id === therapist.id && overlaps(start, end, b.start_min, b.end_min));
    if (busy) return res.status(400).json({ error: 'المختص مشغول في هذا الوقت' });
  } else {
    const free = db.therapists.find(
      (t) =>
        t.branch_id === branchId &&
        t.service_ids.includes(service.id) &&
        t.work_days.includes(weekday) &&
        start >= t.start_min &&
        end <= t.end_min &&
        !dayBookings.some((b) => b.therapist_id === t.id && overlaps(start, end, b.start_min, b.end_min)),
    );
    if (!free) return res.status(400).json({ error: 'لا يوجد مختص متاح لهذه الخدمة في هذا الوقت' });
    therapist = free;
  }

  let room = db.rooms.find((r) => r.id === body.room_id);
  if (!room || room.branch_id !== branchId) {
    room = db.rooms.find(
      (r) =>
        r.branch_id === branchId &&
        r.status !== 'maintenance' &&
        r.service_ids.includes(service.id) &&
        !dayBookings.some((b) => b.room_id === r.id && overlaps(start, end, b.start_min, b.end_min)),
    );
  }
  if (!room) return res.status(400).json({ error: 'لا توجد غرفة مناسبة متاحة' });

  const discount = Number(body.discount) || 0;
  const booking = {
    id: uid('bk'),
    booking_number: bookingNumber(),
    branch_id: branchId,
    customer_id: customer.id,
    customer_name: customer.name,
    customer_phone: customer.phone,
    service_id: service.id,
    service_name: service.name,
    duration_minutes: service.duration_minutes,
    therapist_id: therapist.id,
    therapist_name: therapist.name,
    room_id: room.id,
    room_name: room.name,
    date,
    start_min: start,
    end_min: end,
    price: service.price,
    discount,
    final_amount: Math.max(0, service.price - discount),
    paid_amount: 0,
    payment_method: '',
    status: 'scheduled',
    checkin_at: '',
    session_start_at: '',
    session_end_at: '',
    notes: body.notes || '',
    cancel_reason: '',
    created_at: nowIso(),
  };
  db.bookings.push(booking);
  db.audit.unshift({ id: uid('au'), action: 'إنشاء حجز', entity_type: 'Booking', entity_id: booking.id, user_name: req.user.full_name, details: booking.booking_number, created_at: nowIso() });
  save();
  res.json(booking);
}

app.get('/api/bookings/:id', requireAuth, (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
  res.json({
    booking,
    payments: db.payments.filter((p) => p.booking_id === booking.id),
    consumables: db.consumables.filter((c) => c.booking_id === booking.id),
  });
});

app.get('/api/availability', requireAuth, (req, res) => {
  res.json(
    computeAvailability({
      serviceId: req.query.service_id,
      date: req.query.date || todayStr(),
      therapistId: req.query.therapist_id || '',
      branchId: req.query.branch_id || req.user.branch_id,
    }),
  );
});

app.post('/api/bookings/:id/action', requireAuth, (req, res) => {
  const booking = db.bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: 'الحجز غير موجود' });
  const { action, payload = {} } = req.body || {};

  if (action === 'checkin') {
    booking.status = 'checked-in';
    booking.checkin_at = nowIso();
  } else if (action === 'start') {
    booking.status = 'in-session';
    booking.session_start_at = nowIso();
    if (booking.start_min > 0) {
      const now = new Date();
      booking.start_min = now.getHours() * 60 + now.getMinutes();
      booking.end_min = booking.start_min + booking.duration_minutes;
    }
  } else if (action === 'end') {
    booking.session_end_at = nowIso();
    const remaining = booking.final_amount - (booking.paid_amount || 0);
    booking.status = remaining > 0 ? 'completed-unpaid' : 'paid';
  } else if (action === 'pay') {
    addPayment(booking, payload.amount, payload.method, req.user.full_name);
    if (booking.status === 'completed' || booking.status === 'completed-unpaid') {
      booking.status = booking.paid_amount >= booking.final_amount ? 'paid' : 'completed-unpaid';
    }
  } else if (action === 'cancel') {
    booking.status = 'cancelled';
    booking.cancel_reason = payload.reason || 'سبب آخر';
  } else if (action === 'no-show') {
    booking.status = 'no-show';
  } else if (action === 'reschedule') {
    const start = Number(payload.start_min);
    if (!Number.isFinite(start)) return res.status(400).json({ error: 'وقت غير صالح' });
    booking.date = payload.date || booking.date;
    booking.start_min = start;
    booking.end_min = start + booking.duration_minutes;
    if (payload.therapist_id) {
      const therapist = db.therapists.find((t) => t.id === payload.therapist_id);
      if (therapist) {
        booking.therapist_id = therapist.id;
        booking.therapist_name = therapist.name;
      }
    }
    if (payload.room_id) {
      const room = db.rooms.find((r) => r.id === payload.room_id);
      if (room) {
        booking.room_id = room.id;
        booking.room_name = room.name;
      }
    }
  } else if (action === 'consumable') {
    const item = db.inventory.find((i) => i.id === payload.item_id);
    if (!item) return res.status(400).json({ error: 'المنتج غير موجود' });
    const quantity = Number(payload.quantity) || 0;
    if (quantity <= 0) return res.status(400).json({ error: 'الكمية غير صالحة' });
    item.quantity = Math.max(0, Number(item.quantity) - quantity);
    db.consumables.push({
      id: uid('cn'),
      branch_id: booking.branch_id,
      booking_id: booking.id,
      item_id: item.id,
      item_name: item.name,
      unit: item.unit,
      quantity,
      user_name: req.user.full_name,
      created_at: nowIso(),
    });
  } else {
    return res.status(400).json({ error: 'عملية غير معروفة' });
  }
  save();
  res.json({ booking });
});

app.delete('/api/bookings/:id/consumable/:cid', requireAuth, (req, res) => {
  const index = db.consumables.findIndex((c) => c.id === req.params.cid);
  if (index < 0) return res.status(404).json({ error: 'المستهلك غير موجود' });
  const [row] = db.consumables.splice(index, 1);
  const item = db.inventory.find((i) => i.id === row.item_id);
  if (item) item.quantity = Number(item.quantity) + Number(row.quantity);
  save();
  res.json({ ok: true });
});

/* ------------------------------- dashboards ----------------------------- */

app.get('/api/dashboard', requireAuth, (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const today = todayStr();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const todays = db.bookings
    .filter((b) => b.branch_id === branchId && b.date === today)
    .sort((a, b) => a.start_min - b.start_min);

  const inSession = todays.filter((b) => b.status === 'in-session');
  const upcoming = todays.filter(
    (b) => b.status === 'scheduled' && b.start_min >= nowMin,
  );
  const late = todays.filter(
    (b) => b.status === 'scheduled' && nowMin - b.start_min >= 15,
  );
  const therapists = roomStatusNow(branchId);
  const availableNow = db.therapists.filter(
    (t) =>
      t.branch_id === branchId &&
      !t.on_leave &&
      !inSession.some((b) => b.therapist_id === t.id),
  );

  res.json({
    date: today,
    bookingsToday: todays.length,
    inSession,
    upcoming,
    late,
    therapists,
    stats: {
      bookings_today: todays.length,
      in_session: inSession.length,
      upcoming: upcoming.length,
      available_therapists: availableNow.length,
      revenue_today: db.payments
        .filter((p) => p.branch_id === branchId && String(p.created_at).slice(0, 10) === today)
        .reduce((sum, p) => sum + Number(p.amount || 0), 0),
    },
    branches: db.branches,
    branch: db.branches.find((b) => b.id === branchId),
  });
});

app.get('/api/reports', requireAuth, (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const to = req.query.to || todayStr();
  const from = req.query.from || shiftDate(-6);
  const payments = db.payments.filter(
    (p) => p.branch_id === branchId && String(p.created_at).slice(0, 10) >= from && String(p.created_at).slice(0, 10) <= to,
  );
  const bookings = db.bookings.filter((b) => b.branch_id === branchId && b.date >= from && b.date <= to);
  const totalRevenue = payments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const byTherapist = {};
  const byService = {};
  const byDay = {};
  for (const b of bookings) {
    if (['paid', 'completed-unpaid', 'completed'].includes(b.status)) {
      byTherapist[b.therapist_name] = (byTherapist[b.therapist_name] || 0) + Number(b.final_amount || 0);
      byService[b.service_name] = (byService[b.service_name] || 0) + 1;
    }
  }
  for (const p of payments) {
    const day = String(p.created_at).slice(0, 10);
    byDay[day] = (byDay[day] || 0) + Number(p.amount || 0);
  }
  res.json({
    from,
    to,
    totals: {
      revenue: totalRevenue,
      bookings: bookings.length,
      paid: bookings.filter((b) => b.status === 'paid').length,
      cancelled: bookings.filter((b) => b.status === 'cancelled' || b.status === 'no-show').length,
      payments: payments.length,
    },
    byTherapist: Object.entries(byTherapist).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    byService: Object.entries(byService).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    byDay: Object.entries(byDay).map(([date, value]) => ({ date, value })).sort((a, b) => a.date.localeCompare(b.date)),
    branches: db.branches,
  });
});

app.get('/api/calendar', requireAuth, (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const from = req.query.from || todayStr();
  const to = req.query.to || shiftDate(6);
  const bookings = db.bookings
    .filter((b) => b.branch_id === branchId && b.date >= from && b.date <= to && b.status !== 'cancelled')
    .sort((a, b) => a.start_min - b.start_min);
  res.json({ from, to, bookings, therapists: db.therapists.filter((t) => t.branch_id === branchId), rooms: roomStatusNow(branchId) });
});

app.get('/api/rooms/status', requireAuth, (req, res) => {
  res.json(roomStatusNow(req.query.branch_id || req.user.branch_id));
});

app.get('/api/therapists/status', requireAuth, (req, res) => {
  const branchId = req.query.branch_id || req.user.branch_id;
  const today = todayStr();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const todays = db.bookings.filter((b) => b.branch_id === branchId && b.date === today);
  res.json(
    db.therapists
      .filter((t) => t.branch_id === branchId)
      .map((t) => {
        const current = todays.find((b) => b.therapist_id === t.id && b.status === 'in-session');
        const next = todays
          .filter((b) => b.therapist_id === t.id && ['scheduled', 'checked-in'].includes(b.status) && b.start_min >= nowMin)
          .sort((a, b) => a.start_min - b.start_min)[0];
        const count = todays.filter((b) => b.therapist_id === t.id && b.status !== 'cancelled').length;
        const status = t.on_leave ? 'off-duty' : current ? 'in-session' : next ? 'reserved' : 'available';
        return { ...t, status, current_booking: current || null, next_booking: next || null, bookings_today: count };
      }),
  );
});

app.get('/api/users', requireAuth, (req, res) => {
  res.json(db.users.map((u) => ({ ...u, branch_name: db.branches.find((b) => b.id === u.branch_id)?.name || '' })));
});

app.get('/api/settings', requireAuth, (req, res) => res.json(db.settings));
app.patch('/api/settings', requireAuth, (req, res) => {
  Object.assign(db.settings, req.body, { id: 'settings' });
  save();
  res.json(db.settings);
});

app.get('/api/audit', requireAuth, (req, res) => res.json(db.audit.slice(0, 50)));

app.get('/api/health', (req, res) => res.json({ ok: true }));

/* --------------------------- generic resources -------------------------- */

app.get('/api/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'not found' });
  let rows = [...db[collection]];
  const { branch_id, status, q, from, to, date } = req.query;
  if (branch_id) rows = rows.filter((r) => r.branch_id === branch_id);
  if (status) rows = rows.filter((r) => r.status === status);
  if (date) rows = rows.filter((r) => r.date === date);
  if (from) rows = rows.filter((r) => (r.date || r.created_at || '').slice(0, 10) >= from);
  if (to) rows = rows.filter((r) => (r.date || r.created_at || '').slice(0, 10) <= to);
  if (q) {
    const needle = String(q).toLowerCase();
    rows = rows.filter((r) =>
      ['name', 'customer_name', 'customer_phone', 'phone', 'booking_number', 'gift_code', 'recipient_name', 'giver_name', 'email', 'description']
        .some((key) => String(r[key] || '').toLowerCase().includes(needle)),
    );
  }
  if (collection === 'bookings') rows.sort((a, b) => `${b.date}${hhmm(b.start_min)}`.localeCompare(`${a.date}${hhmm(a.start_min)}`));
  if (collection === 'payments' || collection === 'complaints' || collection === 'gifts' || collection === 'waitlist') {
    rows.sort((a, b) => String(b.created_at || b.issued_at || '').localeCompare(String(a.created_at || a.issued_at || '')));
  }
  if (collection === 'services' || collection === 'users' || collection === 'therapists' || collection === 'customers') {
    rows.sort((a, b) => String(a.name || a.full_name || '').localeCompare(String(b.name || b.full_name || ''), 'ar'));
  }
  res.json(rows);
});

app.get('/api/:collection/:id', requireAuth, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'not found' });
  const row = db[collection].find((r) => r.id === id);
  if (!row) return res.status(404).json({ error: 'العنصر غير موجود' });
  res.json(row);
});

app.post('/api/:collection', requireAuth, (req, res) => {
  const { collection } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'not found' });
  if (collection === 'bookings') return createBooking(req, res);
  const row = { id: uid(collection.slice(0, 2)), created_at: nowIso(), ...req.body };
  if (!row.branch_id && collection !== 'branches') row.branch_id = req.user.branch_id;
  if (collection === 'gifts') {
    row.gift_code = row.gift_code || giftCode();
    row.status = row.status || 'unused';
    row.issued_at = row.issued_at || nowIso();
    row.expires_at = row.expires_at || shiftDate(90);
    row.used_at = row.used_at || '';
  }
  if (collection === 'users') {
    row.role = row.role || 'receptionist';
    row.full_name = row.full_name || String(row.email || '').split('@')[0];
  }
  db[collection].push(row);
  save();
  res.json(row);
});

app.patch('/api/:collection/:id', requireAuth, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'not found' });
  const row = db[collection].find((r) => r.id === id);
  if (!row) return res.status(404).json({ error: 'العنصر غير موجود' });
  Object.assign(row, req.body, { id });
  save();
  res.json(row);
});

app.delete('/api/:collection/:id', requireAuth, (req, res) => {
  const { collection, id } = req.params;
  if (!COLLECTIONS.includes(collection)) return res.status(404).json({ error: 'not found' });
  const index = db[collection].findIndex((r) => r.id === id);
  if (index < 0) return res.status(404).json({ error: 'العنصر غير موجود' });
  const [removed] = db[collection].splice(index, 1);
  if (collection === 'bookings') {
    db.consumables = db.consumables.filter((c) => c.booking_id !== id);
  }
  save();
  res.json(removed);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'حدث خطأ في الخادم' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Spa API listening on 0.0.0.0:${PORT}`);
});
