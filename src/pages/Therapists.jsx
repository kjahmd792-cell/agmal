import { useNavigate } from 'react-router-dom';
import { UserRound, Clock, CalendarDays } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Card, EmptyState, ErrorBox, Loading } from '../components/ui.jsx';
import { THERAPIST_STATUS, time12 } from '../lib.js';

export default function Therapists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: therapists, loading, error, reload } = useFetch(`/therapists/status?branch_id=${user?.branch_id || ''}`);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">المختصون</h1>
        <p className="text-sm text-slate-500 mt-1">حالة المختصين والحجوزات</p>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && (therapists || []).length === 0 && (
        <Card>
          <EmptyState icon={UserRound} title="لا يوجد مختصون" subtitle="أضف المختصين من إعدادات المركز" />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(therapists || []).map((therapist) => (
          <Card key={therapist.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                  <UserRound className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{therapist.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{therapist.specialty}</p>
                </div>
              </div>
              <Badge status={therapist.status} map={THERAPIST_STATUS} />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5" />
                  جلسات اليوم
                </span>
                <span className="text-slate-700 font-medium">{therapist.bookings_today}</span>
              </div>
              {therapist.current_booking && (
                <div className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">
                  في جلسة الآن: {therapist.current_booking.customer_name}
                </div>
              )}
              {therapist.next_booking ? (
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                  القادم: {therapist.next_booking.customer_name} — {time12(therapist.next_booking.start_min)}
                </div>
              ) : (
                !therapist.current_booking && <p className="text-slate-400">لا حجوزات قادمة اليوم</p>
              )}
            </div>

            <button
              onClick={() => navigate('/bookings/new')}
              className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Clock className="w-3.5 h-3.5 inline me-1" />
              حجز موعد
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}
