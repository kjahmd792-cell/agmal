import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  Activity,
  Clock,
  Users,
  Plus,
  UserPlus,
  Gift,
  Search,
  UserRound,
  Sparkles,
  CreditCard,
  CalendarRange,
  TriangleAlert,
  ChevronLeft,
} from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Card, Loading, ErrorBox, StatCard, cn } from '../components/ui.jsx';
import { BOOKING_STATUS, money, time12, dateLabel } from '../lib.js';

const quickActions = [
  { label: 'حجز جديد', desc: 'إنشاء حجز', icon: Plus, to: '/bookings/new', color: 'bg-slate-900 text-white' },
  { label: 'عميل بدون حجز', desc: 'استقبال فوري', icon: UserPlus, to: '/walk-in', color: 'bg-violet-600 text-white' },
  { label: 'حجوزات اليوم', desc: 'عرض القائمة', icon: CalendarDays, to: '/bookings', color: 'bg-blue-600 text-white' },
  { label: 'الهدايا', desc: 'إنشاء وبحث', icon: Gift, to: '/gifts', color: 'bg-rose-600 text-white' },
  { label: 'العملاء', desc: 'بحث وسجل', icon: Search, to: '/customers', color: 'bg-emerald-600 text-white' },
  { label: 'المختصون', desc: 'الحالة الآن', icon: UserRound, to: '/therapists', color: 'bg-amber-600 text-white' },
  { label: 'المدفوعات', desc: 'العمليات', icon: CreditCard, to: '/payments', color: 'bg-teal-600 text-white' },
  { label: 'التقويم', desc: 'جدول أسبوعي', icon: CalendarRange, to: '/calendar', color: 'bg-indigo-600 text-white' },
];

export default function Dashboard() {
  const { user, branches, settings } = useAuth();
  const navigate = useNavigate();
  const branch = branches.find((b) => b.id === user?.branch_id);
  const { data, loading, error, reload } = useFetch(`/dashboard?branch_id=${user?.branch_id || ''}`);

  if (loading) return <Loading />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;

  const stats = [
    { label: 'حجوزات اليوم', value: data.stats.bookings_today, icon: CalendarDays, tone: 'bg-blue-50 text-blue-600' },
    { label: 'الجلسات الجارية', value: data.stats.in_session, icon: Activity, tone: 'bg-violet-50 text-violet-600' },
    { label: 'القادمة', value: data.stats.upcoming, icon: Clock, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'متاحون الآن', value: data.stats.available_therapists, icon: Users, tone: 'bg-amber-50 text-amber-600' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">مرحبًا 👋</h1>
        <p className="text-sm text-slate-500">
          {branch?.name}
          {settings?.spa_name ? ` — ${settings.spa_name}` : ''} • {dateLabel(data.date)}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      {data.late.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TriangleAlert className="w-4 h-4 text-rose-600" />
            <p className="text-sm font-semibold text-rose-700">عملاء متأخرون ({data.late.length})</p>
          </div>
          <div className="space-y-2">
            {data.late.slice(0, 3).map((booking) => (
              <button
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="w-full flex items-center justify-between bg-white rounded-xl p-3 text-right hover:bg-rose-50/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-800">{booking.customer_name}</p>
                  <p className="text-xs text-slate-400">
                    {booking.service_name} • {time12(booking.start_min)}
                  </p>
                </div>
                <Badge status={booking.status} map={BOOKING_STATUS} />
              </button>
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-700 mb-3">اختصارات سريعة</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className="bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all group"
            >
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110',
                  action.color,
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{action.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{action.desc}</p>
            </button>
          );
        })}
      </div>

      {data.inSession.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">الجلسات الجارية الآن</h2>
          <div className="space-y-2">
            {data.inSession.map((booking) => (
              <button
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{booking.customer_name}</p>
                    <p className="text-xs text-slate-400">
                      {booking.service_name} • {booking.therapist_name} • غرفة {booking.room_name}
                    </p>
                  </div>
                </div>
                <Badge status={booking.status} map={BOOKING_STATUS} />
              </button>
            ))}
          </div>
        </div>
      )}

      {data.upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">الحجوزات القادمة</h2>
          <div className="space-y-2">
            {data.upcoming.slice(0, 5).map((booking) => (
              <button
                key={booking.id}
                onClick={() => navigate(`/bookings/${booking.id}`)}
                className="w-full bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800">{booking.customer_name}</p>
                    <p className="text-xs text-slate-400">
                      {booking.service_name} • {time12(booking.start_min)} • {booking.therapist_name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{money(booking.final_amount)}</span>
                  <ChevronLeft className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {data.bookingsToday === 0 && (
        <Card className="p-8 text-center">
          <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">لا توجد حجوزات اليوم</p>
          <p className="text-sm text-slate-400 mt-1">ابدأ بإنشاء حجز جديد من الاختصارات أعلاه</p>
        </Card>
      )}
    </div>
  );
}
