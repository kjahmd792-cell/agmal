import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Gift as GiftIcon, Sparkles } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Select, Textarea } from '../components/ui.jsx';
import { api } from '../api.js';
import { money } from '../lib.js';

export default function GiftNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: services } = useFetch('/services');
  const activeServices = (services || []).filter((s) => s.active !== false);

  const [form, setForm] = useState({
    giver_name: '',
    giver_phone: '',
    recipient_name: '',
    recipient_phone: '',
    service_id: '',
    value: '',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedService = activeServices.find((s) => s.id === form.service_id);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.recipient_name.trim() || !form.service_id) {
      return setError('يرجى إدخال المستفيد واختيار الخدمة');
    }
    setSubmitting(true);
    try {
      const gift = await api.post('/gifts', {
        ...form,
        branch_id: user.branch_id,
        value: Number(form.value) || selectedService?.price || 0,
        service_name: selectedService?.name || '',
        duration_minutes: selectedService?.duration_minutes || 0,
      });
      navigate(`/gifts/${gift.id}`);
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
        <h1 className="text-2xl font-bold text-slate-900">إنشاء هدية</h1>
        <p className="text-sm text-slate-500 mt-1">أصدر كود هدية لجلسة لعميل</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <GiftIcon className="w-4 h-4 text-rose-500" />
            <h2 className="text-sm font-semibold text-slate-800">مقدم الهدية</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="اسم المقدم (إن جديد)">
              <Input value={form.giver_name} onChange={set('giver_name')} placeholder="اسم مقدم الهدية" />
            </Field>
            <Field label="جوال المقدم">
              <Input value={form.giver_phone} onChange={set('giver_phone')} placeholder="05xxxxxxxx" dir="ltr" />
            </Field>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">المستفيد</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="اسم المستفيد">
              <Input value={form.recipient_name} onChange={set('recipient_name')} placeholder="اسم المستفيد" required />
            </Field>
            <Field label="جوال المستفيد">
              <Input value={form.recipient_phone} onChange={set('recipient_phone')} placeholder="05xxxxxxxx" dir="ltr" />
            </Field>
          </div>
        </Card>

        <Card className="p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-800">الهدية</h2>
          <Field label="الخدمة">
            <Select value={form.service_id} onChange={set('service_id')} required>
              <option value="">اختر الخدمة</option>
              {activeServices.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} — {service.duration_minutes} دقيقة — {money(service.price)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="قيمة الهدية" hint={selectedService ? `السعر المقترح ${money(selectedService.price)}` : ''}>
            <Input
              type="number"
              value={form.value}
              onChange={set('value')}
              placeholder={selectedService ? String(selectedService.price) : '0'}
            />
          </Field>
          <Field label="ملاحظات اختيارية">
            <Textarea value={form.notes} onChange={set('notes')} placeholder="ملاحظات عن الهدية" />
          </Field>
        </Card>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          <Sparkles className="w-4 h-4" />
          إصدار الهدية
        </Button>
      </form>
    </div>
  );
}
