import { useMemo, useState } from 'react';
import { Search, CreditCard } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Card, EmptyState, ErrorBox, Input, Loading } from '../components/ui.jsx';
import { PAYMENT_METHODS, money, shortDate, dateTimeLabel } from '../lib.js';

export default function Payments() {
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const { data: payments, loading, error, reload } = useFetch(`/payments?branch_id=${user?.branch_id || ''}`);

  const filtered = useMemo(() => {
    if (!payments) return [];
    if (!q.trim()) return payments;
    const needle = q.trim().toLowerCase();
    return payments.filter((p) => `${p.customer_name} ${p.booking_number}`.toLowerCase().includes(needle));
  }, [payments, q]);

  const total = filtered.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">المدفوعات</h1>
        <p className="text-sm text-slate-500 mt-1">العمليات المالية</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالعميل أو رقم الحجز..." className="pr-9" />
      </div>

      <Card className="p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="text-xs text-slate-400">الإجمالي</p>
            <p className="text-lg font-bold text-slate-900">{money(total)}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400">{filtered.length} عملية</p>
      </Card>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState icon={CreditCard} title="لا توجد مدفوعات" subtitle="ستظهر العمليات هنا بعد تحصيل المدفوعات" />
        </Card>
      )}

      <div className="space-y-2">
        {filtered.map((payment) => (
          <div key={payment.id} className="bg-white rounded-xl border border-slate-100 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{payment.customer_name}</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {payment.booking_number} • {PAYMENT_METHODS[payment.method] || payment.method}
              </p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-sm font-semibold text-slate-800">{money(payment.amount)}</p>
              <p className="text-[11px] text-slate-400">{shortDate(payment.created_at)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
