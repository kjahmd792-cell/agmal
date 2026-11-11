const AR_NUM = new Intl.NumberFormat('ar-SA');

export const money = (value) => `${AR_NUM.format(Number(value) || 0)} ر.س`;

export const timeOf = (min) => {
  const m = Number(min) || 0;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
};

export const time12 = (min) => {
  const m = Number(min) || 0;
  const hours = Math.floor(m / 60);
  const suffix = hours >= 12 ? 'م' : 'ص';
  const h = hours % 12 === 0 ? 12 : hours % 12;
  return `${h}:${String(m % 60).padStart(2, '0')} ${suffix}`;
};

export const parseTime = (value) => {
  if (!value) return 0;
  const [h, m] = String(value).split(':').map(Number);
  return (Number(h) || 0) * 60 + (Number(m) || 0);
};

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const addDays = (days, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const AR_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

export const dateLabel = (value) => {
  if (!value) return '—';
  const d = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '—';
  return `${AR_DAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]}`;
};

export const weekdayName = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  return AR_DAYS[d.getDay()];
};

export const dayNumber = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.getDate();
};

export const shortDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
};

export const dateTimeLabel = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return `${shortDate(value)} - ${time12(d.getHours() * 60 + d.getMinutes())}`;
};

export const nowMinutes = () => {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
};

export const isLate = (booking) =>
  booking.status === 'scheduled' &&
  booking.date === today() &&
  nowMinutes() - booking.start_min >= 15;

export const BOOKING_STATUS = {
  scheduled: { label: 'مجدول', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'checked-in': { label: 'وصل العميل', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  'in-session': { label: 'جلسة جارية', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  completed: { label: 'مكتمل', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  'completed-unpaid': { label: 'مكتمل - غير مدفوع', color: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
  paid: { label: 'مدفوع', color: 'bg-green-100 text-green-700 border-green-200', dot: 'bg-green-600' },
  cancelled: { label: 'ملغي', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
  'no-show': { label: 'لم يحضر', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500' },
};

export const GIFT_STATUS = {
  unused: { label: 'غير مستخدمة', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  reserved: { label: 'محجوز لها موعد', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  used: { label: 'مستخدمة', color: 'bg-slate-200 text-slate-600 border-slate-300' },
  expired: { label: 'منتهية', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-700 border-red-200' },
};

export const ROOM_STATUS = {
  available: { label: 'متاحة', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  reserved: { label: 'محجوزة', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  occupied: { label: 'مشغولة', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  maintenance: { label: 'صيانة', color: 'bg-rose-100 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
};

export const THERAPIST_STATUS = {
  available: { label: 'متاح', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  reserved: { label: 'محجوز', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  'in-session': { label: 'في جلسة', color: 'bg-violet-100 text-violet-700 border-violet-200', dot: 'bg-violet-500' },
  'off-duty': { label: 'غير متاح', color: 'bg-slate-200 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
};

export const COMPLAINT_STATUS = {
  open: { label: 'مفتوحة', color: 'bg-rose-100 text-rose-700 border-rose-200' },
  in_review: { label: 'تحت المراجعة', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  closed: { label: 'مغلقة', color: 'bg-slate-200 text-slate-600 border-slate-300' },
};

export const PAYMENT_METHODS = { cash: 'نقدي', card: 'بطاقة', transfer: 'تحويل', other: 'أخرى' };

export const CANCEL_REASONS = ['العميل ألغى', 'العميل لم يحضر', 'طلب تغيير الموعد', 'المختص غير متاح', 'سبب آخر'];

export const COMPLAINT_TYPES = ['جودة الخدمة', 'سلوك المختص', 'نظافة الغرفة', 'مشكلة في الدفع', 'تأخر الموعد'];

export const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
