import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, UserRound } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Card, EmptyState, ErrorBox, Input, Loading } from '../components/ui.jsx';

export default function Customers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data: customers, loading, error, reload } = useFetch(`/customers?branch_id=${user?.branch_id || ''}`);

  const filtered = useMemo(() => {
    if (!customers) return [];
    if (!q.trim()) return customers;
    const needle = q.trim().toLowerCase();
    return customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(needle));
  }, [customers, q]);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">العملاء</h1>
        <p className="text-sm text-slate-500 mt-1">قاعدة العملاء وسجل الزيارات</p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث بالاسم أو الجوال..." className="pr-9" />
      </div>

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState icon={Users} title="لا يوجد عملاء" subtitle="سيظهر العملاء عند إنشاء حجوزات" />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filtered.map((customer) => (
          <button
            key={customer.id}
            onClick={() => navigate(`/customers/${customer.id}`)}
            className="bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <UserRound className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">{customer.name}</p>
              <p className="text-xs text-slate-400" dir="ltr">
                {customer.phone || '—'}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
