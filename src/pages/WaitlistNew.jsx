import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Select, Textarea } from '../components/ui.jsx';
import { api } from '../api.js';

export default function WaitlistNew() {
  const { user, branches } = useAuth();
  const navigate = useNavigate();
  const { data: services } = useFetch('/services');
  const { data: therapists } = useFetch(`/therapists?branch_id=${user?.branch_id || ''}`);

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    service_id: '',
    preferred_therapist_id: '',
    flexibility: 'اليوم',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.customer_name.trim() || !form.service_id) {
      return setError('يرجى إدخال الاسم واختيار الخدمة');
    }
    setSubmitting(true);
    try {
      const service = (services || []).find((s) => s.id === form.service_id);
      const therapist = (therapists || []).find((t) => t.id === form.preferred_therapist_id);
      await api.post('/waitlist', {
        ...form,
        branch_id: user.branch_id,
        service_name: service?.name || '',
        preferred_therapist_name: therapist?.name || '',
        status: 'waiting',
      });
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">قائمة الانتظار</h1>
        <p className="text-sm text-slate-500 mt-1">أضف عميلًا عندما لا يوجد توفر الآن</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card className="p-5 space-y-3">
          <Field label="اسم العميل">
            <Input value={form.customer_name} onChange={set('customer_name')} placeholder="اسم جديد" required />
          </Field>
          <Field label="رقم الجوال">
            <Input value={form.customer_phone} onChange={set('customer_phone')} placeholder="05xxxxxxxx" dir="ltr" />
          </Field>
          <Field label="الخدمة">
            <Select value={form.service_id} onChange={set('service_id')} required>
              <option value="">اختر الخدمة</option>
              {(services || [])
                .filter((s) => s.active !== false)
                .map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="المختص المفضل (اختياري)">
            <Select value={form.preferred_therapist_id} onChange={set('preferred_therapist_id')}>
              <option value="">أي مختص</option>
              {(therapists || []).map((therapist) => (
                <option key={therapist.id} value={therapist.id}>
                  {therapist.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="المرونة الزمنية">
            <Select value={form.flexibility} onChange={set('flexibility')}>
              <option value="اليوم">اليوم</option>
              <option value="غدًا">غدًا</option>
              <option value="هذا الأسبوع">هذا الأسبوع</option>
            </Select>
          </Field>
          <Field label="ملاحظات">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="ملاحظات إضافية" />
          </Field>
        </Card>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          <CalendarClock className="w-4 h-4" />
          إضافة لقائمة الانتظار
        </Button>
      </form>
    </div>
  );
}
