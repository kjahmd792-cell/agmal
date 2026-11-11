import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Search, UserPlus, UserRound, Zap } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Select } from '../components/ui.jsx';
import { api } from '../api.js';
import { today, nowMinutes, time12 } from '../lib.js';

export default function WalkIn() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: customers } = useFetch(`/customers?branch_id=${user?.branch_id || ''}`);
  const { data: services } = useFetch('/services');

  const [query, setQuery] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const matches = useMemo(() => {
    if (!customers) return [];
    if (!query.trim()) return customers.slice(0, 4);
    const needle = query.trim().toLowerCase();
    return customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(needle)).slice(0, 6);
  }, [customers, query]);

  const selectedCustomer = (customers || []).find((c) => c.id === customerId);

  const availabilityPath = serviceId
    ? `/availability?service_id=${serviceId}&date=${today()}&branch_id=${user?.branch_id || ''}`
    : '';
  const { data: availability, loading: checking } = useFetch(availabilityPath);

  const slots = useMemo(
    () => (availability?.slots || []).filter((s) => s.start_min >= nowMinutes() - 5).slice(0, 12),
    [availability],
  );

  const receive = async () => {
    setError('');
    if (!serviceId) return setError('اختر الخدمة');
    if (!customerId && !newName.trim()) return setError('اختر عميلًا أو أدخل اسمًا جديدًا');
    if (!slot) return setError('اختر وقت الاستقبال');
    setBusy(true);
    try {
      const booking = await api.post('/bookings', {
        branch_id: user.branch_id,
        customer_id: customerId || undefined,
        customer_name: customerId ? undefined : newName.trim(),
        customer_phone: customerId ? undefined : newPhone.trim(),
        service_id: serviceId,
        therapist_id: slot.therapist_id,
        room_id: slot.room_id,
        date: today(),
        start_min: slot.start_min,
        notes: 'استقبال فوري بدون حجز مسبق',
      });
      await api.post(`/bookings/${booking.id}/action`, { action: 'checkin', payload: {} });
      await api.post(`/bookings/${booking.id}/action`, { action: 'start', payload: {} });
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">استقبال عميل بدون حجز</h1>
        <p className="text-sm text-slate-500 mt-1">استقبال فوري — فحص التوفر الآن</p>
      </div>

      <Card className="p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">العميل</h2>
        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <UserRound className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">{selectedCustomer.name}</p>
                <p className="text-xs text-slate-400" dir="ltr">
                  {selectedCustomer.phone}
                </p>
              </div>
            </div>
            <button onClick={() => setCustomerId('')} className="text-xs text-slate-500 underline">
              تغيير
            </button>
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن عميل..." className="pr-9" />
            </div>
            <div className="space-y-1.5 max-h-44 overflow-y-auto mb-3">
              {matches.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setCustomerId(customer.id)}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-slate-300 text-right"
                >
                  <span className="text-sm text-slate-700">{customer.name}</span>
                  <span className="text-xs text-slate-400" dir="ltr">
                    {customer.phone}
                  </span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم عميل جديد">
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="الاسم" />
              </Field>
              <Field label="الجوال">
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
              </Field>
            </div>
          </>
        )}
      </Card>

      <Card className="p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">الخدمة والوقت</h2>
        <Field label="الخدمة">
          <Select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setSlot(null);
            }}
          >
            <option value="">اختر الخدمة</option>
            {(services || [])
              .filter((s) => s.active !== false)
              .map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {service.duration_minutes} دقيقة
                </option>
              ))}
          </Select>
        </Field>

        <div className="mt-4">
          {!serviceId && <p className="text-sm text-slate-400">اختر الخدمة لفحص التوفر الآن.</p>}
          {serviceId && checking && <p className="text-sm text-slate-400">جاري...</p>}
          {serviceId && !checking && slots.length === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-800">لا يوجد توفر الآن</p>
              <p className="text-xs text-amber-700 mt-1">لا يوجد مختص متاح حاليًا. حاول لاحقًا أو أضف العميل لقائمة الانتظار.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/waitlist/new')}>
                إضافة لقائمة الانتظار
              </Button>
            </div>
          )}
          {serviceId && !checking && slots.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slots.map((option) => (
                <button
                  key={`${option.start_min}-${option.therapist_id}`}
                  onClick={() => setSlot(option)}
                  className={`rounded-xl border p-2.5 text-right transition ${
                    slot?.start_min === option.start_min && slot?.therapist_id === option.therapist_id
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-800">الآن — {time12(option.start_min)}</p>
                  <p className="text-[11px] text-slate-500 truncate">{option.therapist_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">غرفة {option.room_name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </Card>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <Button size="lg" className="w-full" loading={busy} onClick={receive}>
        <Zap className="w-4 h-4" />
        استقبال العميل وبدء الجلسة
      </Button>
    </div>
  );
}
