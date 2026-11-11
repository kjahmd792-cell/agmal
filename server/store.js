import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'db.json');

export const pad = (n) => String(n).padStart(2, '0');

export function todayStr(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function shiftDate(days, base = new Date()) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return todayStr(d);
}

export const hhmm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;

const nowIso = () => new Date().toISOString();

let db = null;

function ensureLoaded() {
  if (db) return db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
      return db;
    } catch {
      db = null;
    }
  }
  db = seed();
  save();
  return db;
}

export function getDb() {
  return ensureLoaded();
}

export function save() {
  if (!db) return;
  const tmp = `${FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

export const uid = (prefix = 'id') => `${prefix}_${crypto.randomBytes(5).toString('hex')}`;

function seed() {
  const T = todayStr();
  const Y = shiftDate(-1);
  const D2 = shiftDate(-2);
  const TM = shiftDate(1);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const branches = [
    { id: 'br_riyadh', name: 'فرع الرياض — النرجس', city: 'الرياض', phone: '0112345678' },
    { id: 'br_jeddah', name: 'فرع جدة — الشاطئ', city: 'جدة', phone: '0122345678' },
  ];

  const services = [
    { id: 'sv_relax', name: 'مساج استرخائي', duration_minutes: 60, price: 250, category: 'مساج', description: 'مساج بزيت اللافندر لتهدئة الأعصاب', active: true },
    { id: 'sv_thera', name: 'مساج علاجي للظهر', duration_minutes: 90, price: 380, category: 'مساج', description: 'تخفيف آلام الظهر والرقبة', active: true },
    { id: 'sv_hamam', name: 'حمام مغربي', duration_minutes: 45, price: 180, category: 'عناية', description: 'تقشير وتنظيف عميق للبشرة', active: true },
    { id: 'sv_facial', name: 'تنظيف بشرة', duration_minutes: 60, price: 220, category: 'عناية', description: 'تنظيف وترطيب للبشرة', active: true },
    { id: 'sv_nails', name: 'مانيكير وبديكير', duration_minutes: 75, price: 150, category: 'عناية', description: 'عناية كاملة بالأيدي والأقدام', active: true },
    { id: 'sv_stones', name: 'مساج بالأحجار الساخنة', duration_minutes: 90, price: 420, category: 'مساج', description: 'أحجار بركانية دافئة لاسترخاء العضلات', active: true },
    { id: 'sv_aroma', name: 'علاج بالروائح العطرية', duration_minutes: 60, price: 300, category: 'مساج', description: 'خلطات زيوت عطرية حسب الحالة', active: true },
    { id: 'sv_package', name: 'باقة الاسترخاء الكاملة', duration_minutes: 120, price: 550, category: 'باقات', description: 'مساج + حمام مغربي + تنظيف بشرة', active: true },
  ];

  const allDays = [0, 1, 2, 3, 4, 5, 6];
  const therapists = [
    { id: 'th_noura', branch_id: 'br_riyadh', name: 'نورة الحربي', phone: '0501112233', specialty: 'مساج علاجي', service_ids: ['sv_relax', 'sv_thera', 'sv_stones', 'sv_package'], work_days: allDays, start_min: 600, end_min: 1260, on_leave: false },
    { id: 'th_maha', branch_id: 'br_riyadh', name: 'مها الشمري', phone: '0502223344', specialty: 'عناية بالبشرة', service_ids: ['sv_facial', 'sv_hamam', 'sv_nails'], work_days: [0, 1, 2, 3, 4], start_min: 600, end_min: 1080, on_leave: false },
    { id: 'th_hessa', branch_id: 'br_riyadh', name: 'حصة القحطاني', phone: '0503334455', specialty: 'علاج بالروائح', service_ids: ['sv_aroma', 'sv_relax', 'sv_nails'], work_days: [1, 2, 3, 4, 5, 6], start_min: 780, end_min: 1260, on_leave: false },
    { id: 'th_lama', branch_id: 'br_riyadh', name: 'لمى الدوسري', phone: '0504445566', specialty: 'حمام مغربي', service_ids: ['sv_hamam', 'sv_package', 'sv_facial'], work_days: allDays, start_min: 660, end_min: 1200, on_leave: false },
    { id: 'th_ahmed', branch_id: 'br_riyadh', name: 'أحمد الزهراني', phone: '0505556677', specialty: 'مساج رياضي', service_ids: ['sv_thera', 'sv_stones', 'sv_relax'], work_days: [0, 2, 3, 4, 6], start_min: 960, end_min: 1320, on_leave: false },
    { id: 'th_jeddah', branch_id: 'br_jeddah', name: 'ريم العمري', phone: '0506667788', specialty: 'مساج استرخائي', service_ids: ['sv_relax', 'sv_aroma', 'sv_facial'], work_days: allDays, start_min: 600, end_min: 1200, on_leave: false },
  ];

  const rooms = [
    { id: 'rm_yasmin', branch_id: 'br_riyadh', name: 'الياسمين', status: 'available', service_ids: ['sv_relax', 'sv_aroma', 'sv_facial'], features: ['سرير مساج', 'إضاءة هادئة'] },
    { id: 'rm_lavender', branch_id: 'br_riyadh', name: 'اللافندر', status: 'available', service_ids: ['sv_thera', 'sv_stones', 'sv_package'], features: ['سرير مساج', 'موسيقى'] },
    { id: 'rm_oud', branch_id: 'br_riyadh', name: 'العود', status: 'available', service_ids: ['sv_hamam', 'sv_package'], features: ['حمام مغربي', 'بخار'] },
    { id: 'rm_rose', branch_id: 'br_riyadh', name: 'الورد', status: 'available', service_ids: ['sv_facial', 'sv_nails', 'sv_aroma'], features: ['كرسي عناية', 'مرآة'] },
    { id: 'rm_jasmine', branch_id: 'br_riyadh', name: 'الفُل', status: 'maintenance', service_ids: ['sv_relax', 'sv_thera'], features: ['سرير مساج'] },
    { id: 'rm_sea', branch_id: 'br_jeddah', name: 'البحر', status: 'available', service_ids: ['sv_relax', 'sv_aroma', 'sv_facial', 'sv_thera'], features: ['إطلالة', 'سرير مساج'] },
  ];

  const customers = [
    { id: 'cu_sara', branch_id: 'br_riyadh', name: 'سارة العتيبي', phone: '0551110001', notes: 'تفضل الضغط المتوسط' },
    { id: 'cu_nouf', branch_id: 'br_riyadh', name: 'نوف السبيعي', phone: '0551110002', notes: '' },
    { id: 'cu_reem', branch_id: 'br_riyadh', name: 'ريم المطيري', phone: '0551110003', notes: 'حساسية من زيت اللوز' },
    { id: 'cu_hind', branch_id: 'br_riyadh', name: 'هند الغامدي', phone: '0551110004', notes: '' },
    { id: 'cu_mona', branch_id: 'br_riyadh', name: 'منى الشهري', phone: '0551110005', notes: 'عميلة دائمة' },
    { id: 'cu_amal', branch_id: 'br_riyadh', name: 'أمل البلوي', phone: '0551110006', notes: '' },
    { id: 'cu_layan', branch_id: 'br_riyadh', name: 'ليان العنزي', phone: '0551110007', notes: '' },
    { id: 'cu_dalal', branch_id: 'br_riyadh', name: 'دلال الرشيد', phone: '0551110008', notes: 'تفضل المواعيد المسائية' },
    { id: 'cu_jood', branch_id: 'br_jeddah', name: 'جود الثقفي', phone: '0551110009', notes: '' },
    { id: 'cu_raghad', branch_id: 'br_jeddah', name: 'رغد الزهراني', phone: '0551110010', notes: '' },
  ];

  const svc = (id) => services.find((s) => s.id === id);
  const bkg = (
    id,
    branch_id,
    customer_id,
    therapist_id,
    room_id,
    service_id,
    date,
    start_min,
    status,
    extra = {},
  ) => {
    const service = svc(service_id);
    const customer = customers.find((c) => c.id === customer_id);
    const therapist = therapists.find((t) => t.id === therapist_id);
    const room = rooms.find((r) => r.id === room_id);
    const price = service.price;
    const discount = extra.discount || 0;
    const final_amount = price - discount;
    const paid_amount = extra.paid_amount ?? (status === 'paid' ? final_amount : 0);
    return {
      id,
      booking_number: `BK-${date.replace(/-/g, '')}-${id.slice(-4).toUpperCase()}`,
      branch_id,
      customer_id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      service_id,
      service_name: service.name,
      duration_minutes: service.duration_minutes,
      therapist_id,
      therapist_name: therapist.name,
      room_id,
      room_name: room.name,
      date,
      start_min,
      end_min: start_min + service.duration_minutes,
      price,
      discount,
      final_amount,
      paid_amount,
      payment_method: paid_amount > 0 ? extra.payment_method || 'cash' : '',
      status,
      checkin_at: extra.checkin_at || '',
      session_start_at: extra.session_start_at || '',
      session_end_at: extra.session_end_at || '',
      notes: extra.notes || '',
      cancel_reason: extra.cancel_reason || '',
      created_at: nowIso(),
      ...extra,
    };
  };

  const lateMin = Math.max(660, nowMin - 40);
  const soonMin = Math.min(1290, nowMin + 60);
  const sessionMin = Math.max(600, nowMin - 20);

  const bookings = [
    bkg('bk_1001', 'br_riyadh', 'cu_sara', 'th_noura', 'rm_yasmin', 'sv_relax', T, 600, 'paid', { paid_amount: 250, payment_method: 'card', session_end_at: `${T}T11:00:00`, checkin_at: `${T}T09:55:00` }),
    bkg('bk_1002', 'br_riyadh', 'cu_nouf', 'th_maha', 'rm_rose', 'sv_facial', T, 630, 'completed-unpaid', { checkin_at: `${T}T10:25:00`, session_end_at: `${T}T11:30:00` }),
    bkg('bk_1003', 'br_riyadh', 'cu_reem', 'th_lama', 'rm_oud', 'sv_hamam', T, 780, 'paid', { paid_amount: 180, payment_method: 'cash' }),
    bkg('bk_1004', 'br_riyadh', 'cu_hind', 'th_noura', 'rm_lavender', 'sv_stones', T, sessionMin, 'in-session', { checkin_at: `${T}T10:50:00`, session_start_at: `${T}T11:00:00` }),
    bkg('bk_1005', 'br_riyadh', 'cu_mona', 'th_hessa', 'rm_yasmin', 'sv_aroma', T, soonMin, 'scheduled'),
    bkg('bk_1006', 'br_riyadh', 'cu_amal', 'th_noura', 'rm_lavender', 'sv_thera', T, Math.min(lateMin, 1140), 'scheduled'),
    bkg('bk_1007', 'br_riyadh', 'cu_layan', 'th_lama', 'rm_oud', 'sv_package', T, 960, 'scheduled'),
    bkg('bk_1008', 'br_riyadh', 'cu_dalal', 'th_hessa', 'rm_rose', 'sv_nails', T, 1080, 'scheduled'),
    bkg('bk_1009', 'br_riyadh', 'cu_sara', 'th_noura', 'rm_yasmin', 'sv_thera', T, 1140, 'cancelled', { cancel_reason: 'العميل ألغى' }),
    bkg('bk_1010', 'br_riyadh', 'cu_nouf', 'th_maha', 'rm_rose', 'sv_nails', T, 900, 'no-show'),

    bkg('bk_1011', 'br_riyadh', 'cu_reem', 'th_noura', 'rm_lavender', 'sv_relax', TM, 660, 'scheduled'),
    bkg('bk_1012', 'br_riyadh', 'cu_hind', 'th_maha', 'rm_rose', 'sv_facial', TM, 720, 'scheduled'),
    bkg('bk_1013', 'br_riyadh', 'cu_mona', 'th_lama', 'rm_oud', 'sv_hamam', TM, 840, 'scheduled'),
    bkg('bk_1014', 'br_riyadh', 'cu_dalal', 'th_noura', 'rm_yasmin', 'sv_package', TM, 1000, 'scheduled'),

    bkg('bk_1015', 'br_riyadh', 'cu_amal', 'th_maha', 'rm_rose', 'sv_facial', Y, 660, 'paid', { paid_amount: 220, payment_method: 'card', session_end_at: `${Y}T12:00:00` }),
    bkg('bk_1016', 'br_riyadh', 'cu_layan', 'th_noura', 'rm_lavender', 'sv_thera', Y, 780, 'paid', { paid_amount: 380, payment_method: 'transfer', session_end_at: `${Y}T14:30:00` }),
    bkg('bk_1017', 'br_riyadh', 'cu_sara', 'th_lama', 'rm_oud', 'sv_hamam', Y, 900, 'no-show'),
    bkg('bk_1018', 'br_riyadh', 'cu_nouf', 'th_hessa', 'rm_yasmin', 'sv_aroma', Y, 1020, 'cancelled', { cancel_reason: 'العميل لم يحضر' }),
    bkg('bk_1019', 'br_riyadh', 'cu_hind', 'th_noura', 'rm_lavender', 'sv_stones', D2, 660, 'paid', { paid_amount: 420, payment_method: 'card' }),
    bkg('bk_1020', 'br_riyadh', 'cu_mona', 'th_noura', 'rm_lavender', 'sv_package', D2, 840, 'paid', { paid_amount: 550, payment_method: 'cash', discount: 0 }),

    bkg('bk_1021', 'br_jeddah', 'cu_jood', 'th_jeddah', 'rm_sea', 'sv_relax', T, 660, 'paid', { paid_amount: 250, payment_method: 'card' }),
    bkg('bk_1022', 'br_jeddah', 'cu_raghad', 'th_jeddah', 'rm_sea', 'sv_aroma', T, 840, 'scheduled'),
  ];

  const payments = bookings
    .filter((b) => b.paid_amount > 0)
    .map((b, i) => ({
      id: `pay_${100 + i}`,
      branch_id: b.branch_id,
      booking_id: b.id,
      booking_number: b.booking_number,
      customer_name: b.customer_name,
      amount: b.paid_amount,
      method: b.payment_method || 'cash',
      user_name: 'سارة العتيبي',
      created_at: `${b.date}T${hhmm(b.start_min)}:00`,
    }));

  const gifts = [
    { id: 'gf_1', gift_code: 'GIFT-4821', branch_id: 'br_riyadh', giver_name: 'منى الشهري', giver_phone: '0551110005', recipient_name: 'هيا العلي', recipient_phone: '0559990001', service_id: 'sv_relax', service_name: 'مساج استرخائي', duration_minutes: 60, value: 250, notes: 'هدية عيد ميلاد', status: 'unused', issued_at: `${T}T10:00:00`, expires_at: shiftDate(90), used_at: '' },
    { id: 'gf_2', gift_code: 'GIFT-9134', branch_id: 'br_riyadh', giver_name: 'سارة العتيبي', giver_phone: '0551110001', recipient_name: 'بدرية السالم', recipient_phone: '0559990002', service_id: 'sv_package', service_name: 'باقة الاسترخاء الكاملة', duration_minutes: 120, value: 550, notes: '', status: 'reserved', issued_at: `${Y}T12:00:00`, expires_at: shiftDate(60), used_at: '' },
    { id: 'gf_3', gift_code: 'GIFT-2377', branch_id: 'br_riyadh', giver_name: 'نوف السبيعي', giver_phone: '0551110002', recipient_name: 'أروى الحربي', recipient_phone: '0559990003', service_id: 'sv_facial', service_name: 'تنظيف بشرة', duration_minutes: 60, value: 220, notes: '', status: 'used', issued_at: `${D2}T09:00:00`, expires_at: shiftDate(30), used_at: `${Y}T16:00:00` },
    { id: 'gf_4', gift_code: 'GIFT-5510', branch_id: 'br_riyadh', giver_name: 'ريم المطيري', giver_phone: '0551110003', recipient_name: 'سلمى القاسم', recipient_phone: '0559990004', service_id: 'sv_stones', service_name: 'مساج بالأحجار الساخنة', duration_minutes: 90, value: 420, notes: '', status: 'expired', issued_at: `${D2}T10:00:00`, expires_at: Y, used_at: '' },
    { id: 'gf_5', gift_code: 'GIFT-8830', branch_id: 'br_riyadh', giver_name: 'هند الغامدي', giver_phone: '0551110004', recipient_name: 'لطيفة النعيمي', recipient_phone: '0559990005', service_id: 'sv_nails', service_name: 'مانيكير وبديكير', duration_minutes: 75, value: 150, notes: '', status: 'unused', issued_at: `${T}T11:30:00`, expires_at: shiftDate(90), used_at: '' },
  ];

  const complaints = [
    { id: 'cm_1', branch_id: 'br_riyadh', type: 'تأخر الموعد', description: 'العميلة انتظرت 25 دقيقة قبل بدء الجلسة.', booking_id: 'bk_1006', booking_number: 'BK-1006', customer_name: 'أمل البلوي', status: 'open', created_at: `${T}T11:20:00` },
    { id: 'cm_2', branch_id: 'br_riyadh', type: 'نظافة الغرفة', description: 'منشفة غير نظيفة في غرفة الورد.', booking_id: '', booking_number: '', customer_name: 'منى الشهري', status: 'in_review', created_at: `${Y}T14:10:00` },
    { id: 'cm_3', branch_id: 'br_riyadh', type: 'مشكلة في الدفع', description: 'تم خصم المبلغ مرتين من البطاقة.', booking_id: 'bk_1015', booking_number: 'BK-1015', customer_name: 'أمل البلوي', status: 'closed', created_at: `${D2}T18:00:00` },
  ];

  const waitlist = [
    { id: 'wl_1', branch_id: 'br_riyadh', customer_name: 'شهد العنزي', customer_phone: '0557770001', service_id: 'sv_stones', service_name: 'مساج بالأحجار الساخنة', preferred_therapist_id: 'th_noura', preferred_therapist_name: 'نورة الحربي', flexibility: 'اليوم', notes: 'تفضل بعد العصر', status: 'waiting', created_at: `${T}T10:30:00` },
    { id: 'wl_2', branch_id: 'br_riyadh', customer_name: 'غادة المالكي', customer_phone: '0557770002', service_id: 'sv_relax', service_name: 'مساج استرخائي', preferred_therapist_id: '', preferred_therapist_name: '', flexibility: 'هذا الأسبوع', notes: '', status: 'waiting', created_at: `${Y}T17:00:00` },
  ];

  const inventory = [
    { id: 'inv_1', branch_id: 'br_riyadh', name: 'زيت تدليك عطري', category: 'زيوت', quantity: 12, unit: 'لتر', low_stock: 4, cost: 85 },
    { id: 'inv_2', branch_id: 'br_riyadh', name: 'مناشف قطنية', category: 'مناشف', quantity: 30, unit: 'قطعة', low_stock: 10, cost: 25 },
    { id: 'inv_3', branch_id: 'br_riyadh', name: 'أحجار بركانية', category: 'مستلزمات', quantity: 3, unit: 'علبة', low_stock: 5, cost: 120 },
    { id: 'inv_4', branch_id: 'br_riyadh', name: 'مقشر حمام مغربي', category: 'عناية', quantity: 8, unit: 'كجم', low_stock: 3, cost: 60 },
    { id: 'inv_5', branch_id: 'br_riyadh', name: 'قفازات عناية', category: 'مستلزمات', quantity: 0, unit: 'عبوة', low_stock: 6, cost: 40 },
    { id: 'inv_6', branch_id: 'br_jeddah', name: 'زيت لافندر', category: 'زيوت', quantity: 6, unit: 'لتر', low_stock: 2, cost: 95 },
  ];

  const users = [
    { id: 'us_sara', full_name: 'سارة العتيبي', email: 'demo@spa.app', role: 'admin', branch_id: 'br_riyadh', notify_bookings: true, notify_late: true, notify_payments: true },
    { id: 'us_mohammed', full_name: 'محمد الغانم', email: 'mohammed@spa.app', role: 'receptionist', branch_id: 'br_riyadh', notify_bookings: true, notify_late: false, notify_payments: false },
    { id: 'us_rana', full_name: 'رنا الصالح', email: 'rana@spa.app', role: 'admin', branch_id: 'br_jeddah', notify_bookings: true, notify_late: true, notify_payments: true },
  ];

  const settings = {
    id: 'settings',
    spa_name: 'مركز السبا',
    phone: '0112345678',
    whatsapp: '0551234567',
    address: 'الرياض، حي النرجس، طريق الأمير محمد بن سلمان',
    open_time: '10:00',
    close_time: '22:00',
    work_days: [0, 1, 2, 3, 4, 5, 6],
    cancel_hours: 6,
    cancel_fee_percent: 25,
  };

  return {
    branches,
    services,
    therapists,
    rooms,
    customers,
    bookings,
    payments,
    gifts,
    complaints,
    waitlist,
    inventory,
    consumables: [],
    users,
    settings,
    sessions: {},
    audit: [],
    meta: { seeded_at: nowIso() },
  };
}
