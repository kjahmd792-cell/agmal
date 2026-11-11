import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Search,
  UserRound,
  Plus,
  Clock,
  Sparkles,
  Check,
  UserPlus,
  CalendarClock,
} from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Loading, Select, Textarea, cn } from '../components/ui.jsx';
import { api } from '../api.js';
import { money, time12, today, nowMinutes } from '../lib.js';

export default function BookingNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const branchId = user?.branch_id || '';

  const { data: customers } = useFetch(`/customers?branch_id=${branchId}`);
  const { data: services } = useFetch('/services');
  const { data: therapists } = useFetch(`/therapists?branch_id=${branchId}`);
  const { data: settings } = useFetch('/settings');

  const activeServices = (services || []).filter((s) => s.active !== false);
  const [customerId, setCustomerId] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const [serviceId, setServiceId] = useState(params.get('service') || '');
  const [therapistId, setTherapistId] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCustomer = (customers || []).find((c) => c.id === customerId);
  const selectedService = activeServices.find((s) => s.id === serviceId);

  const matches = useMemo(() => {
    if (!customerQuery.trim()) return (customers || []).slice(0, 4);
    const needle = customerQuery.trim().toLowerCase();
    return (customers || [])
      .filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(needle))
      .slice(0, 6);
  }, [customers, customerQuery]);

  const availabilityPath =
    serviceId && date
      ? `/availability?service_id=${serviceId}&date=${date}&therapist_id=${therapistId}&branch_id=${branchId}`
      : '';
  const { data: availability, loading: checking } = useFetch(availabilityPath);

  const slots = useMemo(() => {
    let list = availability?.slots || [];
    if (date === today()) list = list.filter((slot) => slot.start_min >= nowMinutes() - 5);
    return list;
  }, [availability, date]);

  const filteredTherapists = (therapists || []).filter(
    (t) => !serviceId || t.service_ids?.includes(serviceId),
  );

  const submit = async () => {
    setError('');
    if (!serviceId) return setError('يرجى اختيار الخدمة');
    if (!customerId && !newName.trim()) return setError('يرجى اختيار عميل أو إنشاء عميل جديد');
    if (!selectedSlot) return setError('يرجى اختيار وقت متاح');

    setSubmitting(true);
    try {
      const booking = await api.post('/bookings', {
        branch_id: branchId,
        customer_id: customerId || undefined,
        customer_name: customerId ? undefined : newName.trim(),
        customer_phone: customerId ? undefined : newPhone.trim(),
        service_id: serviceId,
        therapist_id: selectedSlot.therapist_id,
        room_id: selectedSlot.room_id,
        date,
        start_min: selectedSlot.start_min,
        notes,
      });
      navigate(`/bookings/${booking.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">حجز جديد</h1>
        <p className="text-sm text-slate-500 mt-1">أدخل بيانات العميل والخدمة، ثم افحص التوفر تلقائيًا</p>
      </div>

      <Card className="p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">بيانات العميل</h2>
          <button
            onClick={() => {
              setShowNewCustomer((v) => !v);
              setCustomerId('');
            }}
            className="text-xs font-medium text-slate-600 flex items-center gap-1 hover:text-slate-900"
          >
            <UserPlus className="w-3.5 h-3.5" />
            عميل جديد
          </button>
        </div>

        {selectedCustomer ? (
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-slate-200">
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
        ) : showNewCustomer ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="الاسم">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اسم العميل" />
            </Field>
            <Field label="رقم الجوال">
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xxxxxxxx" dir="ltr" />
            </Field>
          </div>
        ) : (
          <>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="ابحث عن عميل سابق بالاسم أو الجوال..."
                className="pr-9"
              />
            </div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto">
              {matches.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    setCustomerId(customer.id);
                    setCustomerQuery('');
                  }}
                  className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5 hover:border-slate-300 hover:bg-slate-50 text-right"
                >
                  <span className="text-sm text-slate-700">{customer.name}</span>
                  <span className="text-xs text-slate-400" dir="ltr">
                    {customer.phone}
                  </span>
                </button>
              ))}
              {matches.length === 0 && <p className="text-sm text-slate-400 py-2">لا يوجد عملاء مطابقون</p>}
            </div>
          </>
        )}
      </Card>

      <Card className="p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">الخدمة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {activeServices.map((service) => (
            <button
              key={service.id}
              onClick={() => {
                setServiceId(service.id);
                setSelectedSlot(null);
                setTherapistId('');
              }}
              className={cn(
                'rounded-xl border p-3 text-right transition',
                serviceId === service.id
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-100 hover:border-slate-300',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{service.name}</p>
                {serviceId === service.id && <Check className="w-4 h-4" />}
              </div>
              <p className={cn('text-xs mt-1', serviceId === service.id ? 'text-white/70' : 'text-slate-400')}>
                {service.duration_minutes} دقيقة • {money(service.price)}
              </p>
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <h2 className="text-sm font-semibold text-slate-800 mb-3">المختص والوقت</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="المختص">
            <Select
              value={therapistId}
              onChange={(e) => {
                setTherapistId(e.target.value);
                setSelectedSlot(null);
              }}
            >
              <option value="">أي مختص (أقرب وقت)</option>
              {filteredTherapists.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="التاريخ">
            <Input
              type="date"
              value={date}
              min={today()}
              onChange={(e) => {
                setDate(e.target.value);
                setSelectedSlot(null);
              }}
            />
          </Field>
          <div className="flex items-end">
            <div className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
              {selectedSlot
                ? `${time12(selectedSlot.start_min)} • ${selectedSlot.therapist_name} • غرفة ${selectedSlot.room_name}`
                : 'اختر وقتًا متاحًا بالأسفل'}
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!serviceId && <p className="text-sm text-slate-400">اختر الخدمة أولًا لعرض الأوقات المتاحة.</p>}
          {serviceId && checking && <Loading text="جاري الفحص..." />}
          {serviceId && !checking && slots.length === 0 && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm font-medium text-amber-800">لا يوجد توفر في هذا اليوم</p>
              <p className="text-xs text-amber-700 mt-1">جرّب يومًا آخر أو أضف العميل لقائمة الانتظار.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/waitlist/new')}>
                <CalendarClock className="w-4 h-4" />
                إضافة لقائمة الانتظار
              </Button>
            </div>
          )}
          {serviceId && !checking && slots.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <p className="text-xs font-medium text-slate-600">الأوقات المتاحة ({slots.length})</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto">
                {slots.map((slot) => {
                  const active =
                    selectedSlot &&
                    selectedSlot.start_min === slot.start_min &&
                    selectedSlot.therapist_id === slot.therapist_id;
                  return (
                    <button
                      key={`${slot.therapist_id}-${slot.start_min}`}
                      onClick={() => setSelectedSlot(slot)}
                      className={cn(
                        'rounded-xl border p-2.5 text-right transition',
                        active
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50',
                      )}
                    >
                      <p className="text-sm font-semibold text-slate-800">{time12(slot.start_min)}</p>
                      <p className="text-[11px] text-slate-500 truncate">{slot.therapist_name}</p>
                      <p className="text-[11px] text-slate-400 truncate">غرفة {slot.room_name}</p>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <Field label="ملاحظات (اختياري)">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="ملاحظات عن العميل أو الجلسة" />
        </Field>
      </Card>

      {error && <p className="text-sm text-rose-600 mb-3">{error}</p>}

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {selectedService ? `${selectedService.name} • ${money(selectedService.price)}` : 'لم يتم اختيار خدمة'}
        </p>
        <Button onClick={submit} loading={submitting} size="lg" disabled={!selectedSlot}>
          <Sparkles className="w-4 h-4" />
          تأكيد الحجز
        </Button>
      </div>
    </div>
  );
}
