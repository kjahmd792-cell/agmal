import { DoorOpen, Wrench } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Card, EmptyState, ErrorBox, Loading } from '../components/ui.jsx';
import { ROOM_STATUS, time12 } from '../lib.js';

export default function Rooms() {
  const { user } = useAuth();
  const { data: rooms, loading, error, reload } = useFetch(`/rooms/status?branch_id=${user?.branch_id || ''}`);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">الغرف</h1>
        <p className="text-sm text-slate-500 mt-1">حالة الغرف في هذا الفرع</p>
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && (rooms || []).length === 0 && (
        <Card>
          <EmptyState icon={DoorOpen} title="لا توجد غرف" subtitle="أضف الغرف من إعدادات المركز" />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {(rooms || []).map((room) => (
          <Card key={room.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                {room.status === 'maintenance' ? (
                  <Wrench className="w-5 h-5 text-rose-500" />
                ) : (
                  <DoorOpen className="w-5 h-5 text-violet-600" />
                )}
              </div>
              <Badge status={room.status} map={ROOM_STATUS} />
            </div>
            <p className="font-semibold text-slate-800 text-sm">غرفة {room.name}</p>
            {room.features?.length > 0 && (
              <p className="text-[11px] text-slate-400 mt-0.5 truncate">{room.features.join(' · ')}</p>
            )}
            <div className="mt-3 text-xs">
              {room.live_booking ? (
                <p className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-violet-700">
                  جلسة جارية: {room.live_booking.customer_name} حتى {time12(room.live_booking.end_min)}
                </p>
              ) : room.upcoming_booking ? (
                <p className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-slate-600">
                  محجوزة: {room.upcoming_booking.customer_name} — {time12(room.upcoming_booking.start_min)}
                </p>
              ) : (
                <p className="text-slate-400">لا حجوزات اليوم</p>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
