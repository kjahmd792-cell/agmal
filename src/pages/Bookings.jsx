import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, SlidersHorizontal, CalendarDays, Clock, ArrowRight, X } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Input, Loading, Select, Tabs, cn } from '../components/ui.jsx';
import { BOOKING_STATUS, money, time12, today, addDays, isLate } from '../lib.js';

const statusFilters = [
  { value: '', label: 'كل الحالات' },
  { value: 'scheduled', label: 'مجدول' },
  { value: 'checked-in', label: 'وصل' },
  { value: 'in-session', label: 'جارية' },
  { value: 'completed-unpaid', label: 'غير مدفوع' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'cancelled', label: 'ملغي' },
  { value: 'no-show', label: 'لم يحضر' },
];

export default function Bookings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scope, setScope] = useState('today');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [therapistId, setTherapistId] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const { data: bookings, loading, error, reload } = useFetch(`/bookings?branch_id=${user?.branch_id || ''}`);
  const { data: therapists } = useFetch(`/therapists?branch_id=${user?.branch_id || ''}`);

  const filtered = useMemo(() => {
    if (!bookings) return [];
    const t = today();
    const tomorrow = addDays(1);
    return bookings
      .filter((b) => {
        if (scope === 'today' && b.date !== t) return false;
        if (scope === 'tomorrow' && b.date !== tomorrow) return false;
        if (status && b.status !== status) return false;
        if (therapistId && b.therapist_id !== therapistId) return false;
        if (q.trim()) {
          const needle = q.trim().toLowerCase();
          const haystack = `${b.customer_name} ${b.customer_phone} ${b.booking_number} ${b.service_name}`.toLowerCase();
          if (!haystack.includes(needle)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return b.date.localeCompare(a.date);
        return a.start_min - b.start_min;
      });
  }, [bookings, scope, status, therapistId, q]);

  const counts = useMemo(() => {
    if (!bookings) return {};
    const t = today();
    return {
      today: bookings.filter((b) => b.date === t).length,
      tomorrow: bookings.filter((b) => b.date === addDays(1)).length,
      all: bookings.length,
    };
  }, [bookings]);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">الحجوزات</h1>
          <p className="text-sm text-slate-500 mt-1">إدارة الحجوزات وحالات الجلسات</p>
        </div>
        <Button onClick={() => navigate('/bookings/new')}>
          <Plus className="w-4 h-4" />
          حجز جديد
        </Button>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم، الجوال، أو رقم الحجز..."
            className="pr-9"
          />
        </div>
        <Button variant="outline" onClick={() => setShowFilters((v) => !v)} className="shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          تصفية
        </Button>
      </div>

      {showFilters && (
        <Card className="p-4 mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">الحالة</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusFilters.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-slate-600">المختص</span>
            <Select value={therapistId} onChange={(e) => setTherapistId(e.target.value)}>
              <option value="">كل المختصين</option>
              {(therapists || []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </label>
          <div className="flex items-end">
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => {
                setStatus('');
                setTherapistId('');
                setQ('');
              }}
            >
              <X className="w-4 h-4" />
              مسح الفلاتر
            </Button>
          </div>
        </Card>
      )}

      <Tabs
        className="mb-4"
        value={scope}
        onChange={setScope}
        items={[
          { value: 'today', label: 'اليوم', count: counts.today },
          { value: 'tomorrow', label: 'غدًا', count: counts.tomorrow },
          { value: 'all', label: 'الكل', count: counts.all },
        ]}
      />

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={CalendarDays}
            title="لا توجد حجوزات"
            subtitle="ابحث بفلاتر مختلفة أو أنشئ حجزًا جديدًا"
            action={
              <Button onClick={() => navigate('/bookings/new')}>
                <Plus className="w-4 h-4" />
                حجز جديد
              </Button>
            }
          />
        </Card>
      )}

      <div className="space-y-2.5">
        {filtered.map((booking) => (
          <button
            key={booking.id}
            onClick={() => navigate(`/bookings/${booking.id}`)}
            className="w-full bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex flex-col items-center justify-center shrink-0">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mb-0.5" />
                  <span className="text-[10px] font-semibold text-slate-700">{time12(booking.start_min)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-800 text-sm truncate">{booking.customer_name}</p>
                    {isLate(booking) && (
                      <span className="text-[10px] rounded-full bg-rose-100 text-rose-600 px-2 py-0.5 font-medium">متأخر</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {booking.service_name} • {booking.duration_minutes} دقيقة
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                    {booking.therapist_name} • غرفة {booking.room_name} • {booking.booking_number}
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge status={booking.status} map={BOOKING_STATUS} />
                <span className="text-xs font-medium text-slate-600">{money(booking.final_amount)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
