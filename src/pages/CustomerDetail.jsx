import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, UserRound, Phone, CalendarDays, CheckCircle2, Banknote, Clock } from 'lucide-react';
import { useFetch } from '../context.jsx';
import { Badge, Card, EmptyState, ErrorBox, Loading, Row, StatCard } from '../components/ui.jsx';
import { BOOKING_STATUS, money, shortDate, time12, today } from '../lib.js';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: customer, loading, error, reload } = useFetch(`/customers/${id}`);
  const { data: bookings } = useFetch('/bookings');

  const customerBookings = useMemo(() => {
    if (!bookings || !customer) return [];
    return bookings
      .filter((b) => b.customer_id === customer.id)
      .sort((a, b) => `${b.date}${b.start_min}`.localeCompare(`${a.date}${a.start_min}`));
  }, [bookings, customer]);

  const stats = useMemo(() => {
    const completed = customerBookings.filter((b) => ['paid', 'completed', 'completed-unpaid'].includes(b.status));
    const upcoming = customerBookings.filter((b) => ['scheduled', 'checked-in'].includes(b.status) && b.date >= today());
    const totalPaid = customerBookings.reduce((sum, b) => sum + Number(b.paid_amount || 0), 0);
    return { visits: completed.length, upcoming: upcoming.length, totalPaid };
  }, [customerBookings]);

  if (loading) return <Loading />;
  if (error || !customer) return <ErrorBox message={error || 'العميل غير موجود'} onRetry={reload} />;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
            <UserRound className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-900">{customer.name}</h1>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-1" dir="ltr">
              <Phone className="w-3.5 h-3.5" />
              {customer.phone || '—'}
            </p>
            {customer.created_at && <p className="text-[11px] text-slate-400 mt-1">عميل منذ {shortDate(customer.created_at)}</p>}
          </div>
        </div>
        {customer.notes && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">{customer.notes}</div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <StatCard icon={CalendarDays} label="عدد الزيارات" value={stats.visits} tone="bg-blue-50 text-blue-600" />
        <StatCard icon={Banknote} label="إجمالي المدفوع" value={money(stats.totalPaid)} tone="bg-teal-50 text-teal-600" />
        <StatCard icon={Clock} label="حجوزات قادمة" value={stats.upcoming} tone="bg-amber-50 text-amber-600" />
      </div>

      <h2 className="text-sm font-semibold text-slate-700 mb-3">سجل الحجوزات</h2>
      {customerBookings.length === 0 ? (
        <Card>
          <EmptyState icon={CalendarDays} title="لا توجد حجوزات" subtitle="لم يقم هذا العميل بأي حجز بعد" />
        </Card>
      ) : (
        <div className="space-y-2">
          {customerBookings.map((booking) => (
            <button
              key={booking.id}
              onClick={() => navigate(`/bookings/${booking.id}`)}
              className="w-full bg-white rounded-xl border border-slate-100 p-3.5 text-right hover:border-slate-300 transition-colors flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-800">{booking.service_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {shortDate(booking.date)} • {time12(booking.start_min)} • {booking.therapist_name}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-slate-500">{money(booking.final_amount)}</span>
                <Badge status={booking.status} map={BOOKING_STATUS} />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
