import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, MessageSquareWarning } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Select, Textarea } from '../components/ui.jsx';
import { api } from '../api.js';
import { COMPLAINT_TYPES, shortDate, time12 } from '../lib.js';

export default function ComplaintNew() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const bookingId = params.get('booking') || '';
  const { data: bookings } = useFetch(`/bookings?branch_id=${user?.branch_id || ''}`);

  const [type, setType] = useState(COMPLAINT_TYPES[0]);
  const [description, setDescription] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [linkedBooking, setLinkedBooking] = useState(bookingId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const recentBookings = useMemo(() => (bookings || []).slice(0, 30), [bookings]);
  const selectedBooking = (bookings || []).find((b) => b.id === linkedBooking);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!description.trim()) return setError('يرجى وصف المشكلة');
    setSubmitting(true);
    try {
      await api.post('/complaints', {
        branch_id: user.branch_id,
        type,
        description: description.trim(),
        customer_name: customerName.trim() || selectedBooking?.customer_name || '',
        booking_id: linkedBooking,
        booking_number: selectedBooking?.booking_number || '',
        status: 'open',
      });
      navigate('/complaints');
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
        <h1 className="text-2xl font-bold text-slate-900">شكوى جديدة</h1>
        <p className="text-sm text-slate-500 mt-1">سجّل المشكلة لمتابعتها مع الفريق</p>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <Card className="p-5 space-y-3">
          <Field label="نوع المشكلة">
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {COMPLAINT_TYPES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="الوصف">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="اشرح المشكلة بالتفصيل..."
              required
            />
          </Field>
          <Field label="اسم العميل">
            <Input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={selectedBooking?.customer_name || 'اسم العميل'}
            />
          </Field>
          <Field label="الحجز المرتبط (اختياري)">
            <Select value={linkedBooking} onChange={(e) => setLinkedBooking(e.target.value)}>
              <option value="">بدون حجز</option>
              {recentBookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.booking_number} — {booking.customer_name} — {shortDate(booking.date)} {time12(booking.start_min)}
                </option>
              ))}
            </Select>
          </Field>
        </Card>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          <MessageSquareWarning className="w-4 h-4" />
          تسجيل الشكوى
        </Button>
      </form>
    </div>
  );
}
