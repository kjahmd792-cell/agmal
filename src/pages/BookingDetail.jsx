import { useMemo, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import {
  ArrowRight,
  User,
  Scissors,
  UserRound,
  DoorOpen,
  CalendarDays,
  Clock,
  Banknote,
  CheckCircle2,
  Ban,
  PlayCircle,
  LogIn,
  Package,
  MessageSquareWarning,
  CalendarClock,
} from 'lucide-react';
import { useFetch } from '../context.jsx';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, Modal, Row, Select, cn } from '../components/ui.jsx';
import { api } from '../api.js';
import {
  BOOKING_STATUS,
  CANCEL_REASONS,
  PAYMENT_METHODS,
  money,
  time12,
  dateLabel,
  dateTimeLabel,
  nowMinutes,
  today,
} from '../lib.js';

export default function BookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useOutletContext() || {};
  const { data, loading, error, reload } = useFetch(`/bookings/${id}`);
  const { data: inventory } = useFetch('/inventory');

  const [busy, setBusy] = useState('');
  const [modal, setModal] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('cash');
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [rescheduleDate, setRescheduleDate] = useState(today());
  const [consumableItem, setConsumableItem] = useState('');
  const [consumableQty, setConsumableQty] = useState('1');

  const booking = data?.booking;
  const payments = data?.payments || [];
  const consumables = data?.consumables || [];

  const remaining = booking ? Math.max(0, Number(booking.final_amount) - Number(booking.paid_amount || 0)) : 0;

  const reschedulePath =
    modal === 'reschedule' && booking
      ? `/availability?service_id=${booking.service_id}&date=${rescheduleDate}&therapist_id=${booking.therapist_id}&branch_id=${booking.branch_id}`
      : '';
  const { data: availability } = useFetch(reschedulePath);
  const rescheduleSlots = useMemo(() => {
    let list = availability?.slots || [];
    if (rescheduleDate === today()) list = list.filter((s) => s.start_min >= nowMinutes());
    return list;
  }, [availability, rescheduleDate]);

  const act = async (action, payload) => {
    setBusy(action);
    try {
      await api.post(`/bookings/${id}/action`, { action, payload });
      await reload();
      setModal('');
      showToast?.('تم تنفيذ العملية بنجاح');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const openPayment = () => {
    setPayAmount(String(remaining || booking.final_amount));
    setPayMethod('cash');
    setModal('payment');
  };

  if (loading) return <Loading />;
  if (error || !booking) return <ErrorBox message={error || 'الحجز غير موجود'} onRetry={reload} />;

  const isLate = booking.status === 'scheduled' && booking.date === today() && nowMinutes() - booking.start_min >= 15;

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <Card className="p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-900">{booking.customer_name}</h1>
              <Badge status={booking.status} map={BOOKING_STATUS} />
              {isLate && (
                <span className="text-[10px] rounded-full bg-rose-100 text-rose-600 px-2 py-0.5 font-medium">
                  متأخر {nowMinutes() - booking.start_min} دقيقة
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {booking.booking_number} • {booking.customer_phone}
            </p>
          </div>
          <p className="text-lg font-bold text-slate-900">{money(booking.final_amount)}</p>
        </div>

        <div className="divide-y divide-slate-100">
          <Row icon={Scissors} label="الخدمة" value={`${booking.service_name} • ${booking.duration_minutes} دقيقة`} />
          <Row icon={UserRound} label="المختص" value={booking.therapist_name} />
          <Row icon={DoorOpen} label="الغرفة" value={`غرفة ${booking.room_name}`} />
          <Row icon={CalendarDays} label="التاريخ" value={dateLabel(booking.date)} />
          <Row icon={Clock} label="الوقت المجدول" value={`${time12(booking.start_min)} - ${time12(booking.end_min)}`} />
        </div>
      </Card>

      {(booking.checkin_at || booking.session_start_at || booking.session_end_at) && (
        <Card className="p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-2">الأوقات الفعلية</h2>
          <div className="divide-y divide-slate-100">
            {booking.checkin_at && <Row icon={LogIn} label="وقت الوصول" value={dateTimeLabel(booking.checkin_at)} />}
            {booking.session_start_at && <Row icon={PlayCircle} label="بدء الجلسة" value={dateTimeLabel(booking.session_start_at)} />}
            {booking.session_end_at && <Row icon={CheckCircle2} label="نهاية الجلسة" value={dateTimeLabel(booking.session_end_at)} />}
          </div>
        </Card>
      )}

      <Card className="p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-2">الدفع</h2>
        <div className="divide-y divide-slate-100">
          <Row icon={Banknote} label="السعر الأصلي" value={money(booking.price)} />
          <Row icon={Banknote} label="الخصم" value={money(booking.discount)} />
          <Row icon={Banknote} label="المبلغ النهائي" value={money(booking.final_amount)} />
          <Row icon={CheckCircle2} label="المدفوع" value={money(booking.paid_amount)} />
          <Row icon={Ban} label="المتبقي" value={money(remaining)} />
        </div>
        {payments.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {payments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-500">{PAYMENT_METHODS[payment.method] || payment.method}</span>
                <span className="text-slate-800 font-medium">{money(payment.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-slate-800">المستهلكات</h2>
          <Button variant="outline" size="sm" onClick={() => setModal('consumable')}>
            <Package className="w-3.5 h-3.5" />
            إضافة
          </Button>
        </div>
        {consumables.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">لم يتم تسجيل مستهلكات لهذه الجلسة</p>
        ) : (
          <div className="space-y-1.5">
            {consumables.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                <span className="text-slate-600">
                  {item.item_name} — {item.quantity} {item.unit}
                </span>
                <button
                  onClick={async () => {
                    await api.del(`/bookings/${id}/consumable/${item.id}`);
                    reload();
                  }}
                  className="text-rose-500 hover:underline"
                >
                  حذف
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {booking.notes && (
        <Card className="p-5 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1">ملاحظات</p>
          <p className="text-sm text-slate-600">{booking.notes}</p>
        </Card>
      )}

      <div className="space-y-2.5">
        {booking.status === 'scheduled' && (
          <>
            <Button className="w-full" size="lg" onClick={() => act('checkin')} loading={busy === 'checkin'}>
              <LogIn className="w-4 h-4" />
              تسجيل وصول
            </Button>
            <div className="grid grid-cols-2 gap-2.5">
              <Button variant="outline" onClick={() => setModal('reschedule')}>
                <CalendarClock className="w-4 h-4" />
                إعادة جدولة
              </Button>
              <Button variant="outline" onClick={() => act('no-show')} loading={busy === 'no-show'}>
                <Ban className="w-4 h-4" />
                تسجيل عدم الحضور
              </Button>
            </div>
            <Button variant="danger" className="w-full" onClick={() => setModal('cancel')}>
              <Ban className="w-4 h-4" />
              إلغاء الحجز
            </Button>
          </>
        )}

        {booking.status === 'checked-in' && (
          <>
            <Button className="w-full" size="lg" onClick={() => act('start')} loading={busy === 'start'}>
              <PlayCircle className="w-4 h-4" />
              بدء جلسة
            </Button>
            <Button variant="danger" className="w-full" onClick={() => setModal('cancel')}>
              <Ban className="w-4 h-4" />
              إلغاء الحجز
            </Button>
          </>
        )}

        {booking.status === 'in-session' && (
          <Button className="w-full" size="lg" variant="success" onClick={() => act('end')} loading={busy === 'end'}>
            <CheckCircle2 className="w-4 h-4" />
            إنهاء الجلسة
          </Button>
        )}

        {(booking.status === 'completed-unpaid' || (remaining > 0 && ['in-session', 'paid'].includes(booking.status))) && (
          <Button className="w-full" size="lg" onClick={openPayment}>
            <Banknote className="w-4 h-4" />
            تسجيل الدفع {remaining > 0 ? `— المتبقي ${money(remaining)}` : ''}
          </Button>
        )}

        {booking.status === 'paid' && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 py-3 text-sm text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            تم إغلاق الحجز والدفع
          </div>
        )}

        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate(`/complaints/new?booking=${booking.id}`)}
        >
          <MessageSquareWarning className="w-4 h-4" />
          إضافة شكوى / مشكلة
        </Button>
      </div>

      <Modal
        open={modal === 'payment'}
        onClose={() => setModal('')}
        title="تسجيل دفع"
        footer={
          <Button
            className="w-full"
            loading={busy === 'pay'}
            onClick={() => act('pay', { amount: Number(payAmount) || 0, method: payMethod })}
          >
            تأكيد الدفع
          </Button>
        }
      >
        <div className="space-y-3">
          <Row label="المبلغ النهائي" value={money(booking.final_amount)} />
          <Row label="المدفوع سابقًا" value={money(booking.paid_amount)} />
          <Field label="المبلغ المدفوع الآن (ريال)">
            <Input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </Field>
          <Field label="طريقة الدفع">
            <Select value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
              {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={modal === 'cancel'}
        onClose={() => setModal('')}
        title="إلغاء الحجز"
        footer={
          <Button
            variant="danger"
            className="w-full"
            loading={busy === 'cancel'}
            onClick={() => act('cancel', { reason: cancelReason })}
          >
            تأكيد الإلغاء
          </Button>
        }
      >
        <Field label="اختر سبب الإلغاء">
          <Select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)}>
            {CANCEL_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </Field>
      </Modal>

      <Modal open={modal === 'reschedule'} onClose={() => setModal('')} title="إعادة جدولة" size="lg">
        <Field label="التاريخ">
          <Input type="date" value={rescheduleDate} min={today()} onChange={(e) => setRescheduleDate(e.target.value)} />
        </Field>
        <p className="text-xs font-medium text-slate-600 mt-4 mb-2">الأوقات المتاحة</p>
        {rescheduleSlots.length === 0 ? (
          <p className="text-xs text-slate-400">لا توجد أوقات متاحة في هذا اليوم</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {rescheduleSlots.map((slot) => (
              <button
                key={`${slot.start_min}-${slot.therapist_id}`}
                onClick={() =>
                  act('reschedule', {
                    date: rescheduleDate,
                    start_min: slot.start_min,
                    therapist_id: slot.therapist_id,
                    room_id: slot.room_id,
                  })
                }
                className={cn(
                  'rounded-xl border border-slate-100 p-2.5 text-right hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <p className="text-sm font-semibold text-slate-800">{time12(slot.start_min)}</p>
                <p className="text-[11px] text-slate-500 truncate">{slot.therapist_name}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={modal === 'consumable'}
        onClose={() => setModal('')}
        title="إضافة مستهلك"
        footer={
          <Button
            className="w-full"
            loading={busy === 'consumable'}
            onClick={() => act('consumable', { item_id: consumableItem, quantity: Number(consumableQty) || 0 })}
          >
            تسجيل المستهلك
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="المنتج">
            <Select value={consumableItem} onChange={(e) => setConsumableItem(e.target.value)}>
              <option value="">اختر منتجًا</option>
              {(inventory || [])
                .filter((item) => item.branch_id === booking.branch_id)
                .map((item) => (
                  <option key={item.id} value={item.id} disabled={Number(item.quantity) <= 0}>
                    {item.name} — متاح: {item.quantity} {item.unit}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="الكمية المستهلكة">
            <Input type="number" min="1" value={consumableQty} onChange={(e) => setConsumableQty(e.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
