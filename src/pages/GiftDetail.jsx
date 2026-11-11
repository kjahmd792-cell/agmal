import { useMemo, useState } from 'react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { ArrowRight, Gift as GiftIcon, User, UserRound, CalendarDays, CheckCircle2, Ban, Clock } from 'lucide-react';
import { useFetch } from '../context.jsx';
import { Badge, Button, Card, ErrorBox, Field, Input, Loading, Modal, Row } from '../components/ui.jsx';
import { api } from '../api.js';
import { GIFT_STATUS, money, shortDate, dateTimeLabel, time12, today, nowMinutes } from '../lib.js';

export default function GiftDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useOutletContext() || {};
  const { data: gift, loading, error, reload } = useFetch(`/gifts/${id}`);
  const [modal, setModal] = useState('');
  const [date, setDate] = useState(today());
  const [busy, setBusy] = useState(false);

  const availabilityPath =
    modal === 'use' && gift
      ? `/availability?service_id=${gift.service_id}&date=${date}&branch_id=${gift.branch_id}`
      : '';
  const { data: availability } = useFetch(availabilityPath);
  const slots = useMemo(() => {
    let list = availability?.slots || [];
    if (date === today()) list = list.filter((slot) => slot.start_min >= nowMinutes());
    return list;
  }, [availability, date]);

  const useGift = async (slot) => {
    setBusy(true);
    try {
      const booking = await api.post('/bookings', {
        branch_id: gift.branch_id,
        customer_name: gift.recipient_name,
        customer_phone: gift.recipient_phone,
        service_id: gift.service_id,
        therapist_id: slot.therapist_id,
        room_id: slot.room_id,
        date,
        start_min: slot.start_min,
        discount: Number(gift.value) || 0,
        notes: `هدية ${gift.gift_code}`,
      });
      await api.patch(`/gifts/${gift.id}`, { status: 'used', used_at: new Date().toISOString() });
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const cancelGift = async () => {
    setBusy(true);
    try {
      await api.patch(`/gifts/${gift.id}`, { status: 'cancelled' });
      await reload();
      setModal('');
      showToast?.('تم إلغاء الهدية');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Loading />;
  if (error || !gift) return <ErrorBox message={error || 'الهدية غير موجودة'} onRetry={reload} />;

  const canUse = ['unused', 'reserved'].includes(gift.status);
  const canCancel = !['used', 'cancelled'].includes(gift.status);

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <div className="bg-gradient-to-br from-rose-500 to-rose-700 rounded-3xl p-6 text-white mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <GiftIcon className="w-6 h-6" />
          </div>
          <Badge status={gift.status} map={GIFT_STATUS} className="bg-white/90 border-0" />
        </div>
        <p className="text-rose-100 text-sm mb-1">كود الهدية</p>
        <p className="text-3xl font-bold tracking-wider mb-4">{gift.gift_code}</p>
        <p className="text-2xl font-bold">{money(gift.value)}</p>
        <p className="text-rose-100 text-sm mt-1">
          {gift.service_name} • {gift.duration_minutes} دقيقة
        </p>
      </div>

      <Card className="p-5 mb-4 divide-y divide-slate-100">
        <Row icon={User} label="المستفيد" value={`${gift.recipient_name}${gift.recipient_phone ? ` - ${gift.recipient_phone}` : ''}`} />
        <Row icon={UserRound} label="مقدم الهدية" value={gift.giver_name ? `${gift.giver_name}${gift.giver_phone ? ` - ${gift.giver_phone}` : ''}` : '—'} />
        <Row icon={CalendarDays} label="تاريخ الإصدار" value={shortDate(gift.issued_at)} />
        {gift.expires_at && <Row icon={Clock} label="تاريخ الانتهاء" value={shortDate(gift.expires_at)} />}
        {gift.used_at && <Row icon={CheckCircle2} label="تاريخ الاستخدام" value={dateTimeLabel(gift.used_at)} />}
      </Card>

      {gift.notes && (
        <Card className="p-5 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1">ملاحظات</p>
          <p className="text-sm text-slate-600">{gift.notes}</p>
        </Card>
      )}

      <div className="space-y-2.5">
        {canUse && (
          <Button variant="success" className="w-full" size="lg" onClick={() => setModal('use')}>
            <CheckCircle2 className="w-5 h-5" />
            استخدام الهدية (حجز موعد)
          </Button>
        )}
        {canCancel && (
          <Button variant="danger" className="w-full" onClick={() => setModal('cancel')}>
            <Ban className="w-4 h-4" />
            إلغاء الهدية
          </Button>
        )}
      </div>

      <Modal open={modal === 'use'} onClose={() => setModal('')} title="استخدام الهدية (حجز موعد)" size="lg">
        <Field label="التاريخ">
          <Input type="date" value={date} min={today()} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <p className="text-xs font-medium text-slate-600 mt-4 mb-2">الأوقات المتاحة</p>
        {slots.length === 0 ? (
          <p className="text-xs text-slate-400">لا توجد أوقات متاحة في هذا اليوم</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {slots.map((slot) => (
              <button
                key={`${slot.start_min}-${slot.therapist_id}`}
                disabled={busy}
                onClick={() => useGift(slot)}
                className="rounded-xl border border-slate-100 p-2.5 text-right hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
              >
                <p className="text-sm font-semibold text-slate-800">{time12(slot.start_min)}</p>
                <p className="text-[11px] text-slate-500 truncate">{slot.therapist_name}</p>
                <p className="text-[11px] text-slate-400 truncate">غرفة {slot.room_name}</p>
              </button>
            ))}
          </div>
        )}
      </Modal>

      <Modal
        open={modal === 'cancel'}
        onClose={() => setModal('')}
        title="إلغاء الهدية"
        footer={
          <Button variant="danger" className="w-full" loading={busy} onClick={cancelGift}>
            تأكيد الإلغاء
          </Button>
        }
      >
        <p className="text-sm text-slate-600">هل تريد إلغاء هذه الهدية؟</p>
      </Modal>
    </div>
  );
}
