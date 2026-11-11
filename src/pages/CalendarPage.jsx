import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CalendarRange } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Loading, cn } from '../components/ui.jsx';
import { BOOKING_STATUS, addDays, dateLabel, dayNumber, time12, today, weekdayName } from '../lib.js';

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [start, setStart] = useState(today());

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(i, new Date(`${start}T12:00:00`))), [start]);
  const from = days[0];
  const to = days[6];

  const { data, loading, error, reload } = useFetch(
    `/calendar?branch_id=${user?.branch_id || ''}&from=${from}&to=${to}`,
  );

  const byDay = useMemo(() => {
    const map = {};
    (data?.bookings || []).forEach((booking) => {
      map[booking.date] = map[booking.date] || [];
      map[booking.date].push(booking);
    });
    return map;
  }, [data]);

  const move = (direction) => {
    const base = new Date(`${start}T12:00:00`);
    base.setDate(base.getDate() + direction * 7);
    setStart(`${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">التقويم</h1>
          <p className="text-sm text-slate-500 mt-1">جدول الحجوزات الأسبوعي</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(-1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setStart(today())}>
            اليوم
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        {dateLabel(from)} — {dateLabel(to)}
      </p>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {days.map((day) => {
            const bookings = byDay[day] || [];
            const isToday = day === today();
            return (
              <Card
                key={day}
                className={cn('p-2.5 min-h-[220px]', isToday && 'ring-2 ring-slate-900/10 border-slate-300')}
              >
                <div className="mb-2 pb-2 border-b border-slate-100">
                  <p className="text-[11px] text-slate-400">{weekdayName(day)}</p>
                  <p className={cn('text-sm font-bold', isToday ? 'text-slate-900' : 'text-slate-600')}>
                    {dayNumber(day)}
                  </p>
                </div>
                {bookings.length === 0 ? (
                  <p className="text-[10px] text-slate-300 mt-4 text-center">لا يوجد</p>
                ) : (
                  <div className="space-y-1.5">
                    {bookings.map((booking) => (
                      <button
                        key={booking.id}
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                        className="w-full rounded-lg bg-slate-50 hover:bg-slate-100 p-1.5 text-right"
                      >
                        <p className="text-[10px] font-semibold text-slate-700">{time12(booking.start_min)}</p>
                        <p className="text-[10px] text-slate-500 truncate">{booking.customer_name}</p>
                        <p className="text-[9px] text-slate-400 truncate">{booking.therapist_name}</p>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {data && data.bookings.length === 0 && (
        <Card className="mt-4">
          <EmptyState icon={CalendarRange} title="لا توجد حجوزات هذا الأسبوع" subtitle="جرّب أسبوعًا آخر أو أنشئ حجزًا جديدًا" />
        </Card>
      )}
    </div>
  );
}
