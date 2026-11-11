import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift as GiftIcon, Plus, Search, ChevronLeft } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Input, Loading, Tabs } from '../components/ui.jsx';
import { GIFT_STATUS, money, shortDate } from '../lib.js';

export default function Gifts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('');
  const { data: gifts, loading, error, reload } = useFetch(`/gifts?branch_id=${user?.branch_id || ''}`);

  const filtered = useMemo(() => {
    if (!gifts) return [];
    return gifts.filter((gift) => {
      if (tab && gift.status !== tab) return false;
      if (q.trim()) {
        const needle = q.trim().toLowerCase();
        const haystack = `${gift.gift_code} ${gift.recipient_name} ${gift.giver_name} ${gift.recipient_phone}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [gifts, q, tab]);

  const counts = useMemo(() => {
    const list = gifts || [];
    return {
      all: list.length,
      unused: list.filter((g) => g.status === 'unused').length,
      reserved: list.filter((g) => g.status === 'reserved').length,
      used: list.filter((g) => g.status === 'used').length,
    };
  }, [gifts]);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">الهدايا</h1>
          <p className="text-sm text-slate-500 mt-1">إصدار ومتابعة هدايا الجلسات</p>
        </div>
        <Button onClick={() => navigate('/gifts/new')}>
          <Plus className="w-4 h-4" />
          إنشاء هدية
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ابحث بالكود، المستفيد، أو المقدم..."
          className="pr-9"
        />
      </div>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: '', label: 'الكل', count: counts.all },
          { value: 'unused', label: 'غير مستخدمة', count: counts.unused },
          { value: 'reserved', label: 'محجوز لها موعد', count: counts.reserved },
          { value: 'used', label: 'مستخدمة', count: counts.used },
        ]}
      />

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState
            icon={GiftIcon}
            title="لا توجد هدايا"
            subtitle="أنشئ هدية جديدة لعميل"
            action={
              <Button onClick={() => navigate('/gifts/new')}>
                <Plus className="w-4 h-4" />
                إنشاء هدية
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((gift) => (
          <button
            key={gift.id}
            onClick={() => navigate(`/gifts/${gift.id}`)}
            className="bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <GiftIcon className="w-5 h-5 text-rose-500" />
              </div>
              <Badge status={gift.status} map={GIFT_STATUS} />
            </div>
            <p className="font-bold text-slate-900 tracking-wider">{gift.gift_code}</p>
            <p className="text-sm text-slate-600 mt-1">المستفيد: {gift.recipient_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {gift.service_name} • {gift.duration_minutes} دقيقة
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-800">{money(gift.value)}</span>
              <span className="text-[11px] text-slate-400">{shortDate(gift.issued_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
