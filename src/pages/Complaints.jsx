import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquareWarning } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Badge, Button, Card, EmptyState, ErrorBox, Loading, Tabs } from '../components/ui.jsx';
import { api } from '../api.js';
import { COMPLAINT_STATUS, shortDate } from '../lib.js';

export default function Complaints() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('');
  const { data: complaints, loading, error, reload } = useFetch(`/complaints?branch_id=${user?.branch_id || ''}`);

  const filtered = useMemo(() => {
    if (!complaints) return [];
    return tab ? complaints.filter((c) => c.status === tab) : complaints;
  }, [complaints, tab]);

  const counts = useMemo(() => {
    const list = complaints || [];
    return {
      all: list.length,
      open: list.filter((c) => c.status === 'open').length,
      in_review: list.filter((c) => c.status === 'in_review').length,
      closed: list.filter((c) => c.status === 'closed').length,
    };
  }, [complaints]);

  const setStatus = async (complaint, status) => {
    await api.patch(`/complaints/${complaint.id}`, { status });
    reload();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">المشكلات والشكاوى</h1>
          <p className="text-sm text-slate-500 mt-1">متابعة مشكلات العملاء</p>
        </div>
        <Button onClick={() => navigate('/complaints/new')}>
          <Plus className="w-4 h-4" />
          شكوى جديدة
        </Button>
      </div>

      <Tabs
        className="mb-4"
        value={tab}
        onChange={setTab}
        items={[
          { value: '', label: 'الكل', count: counts.all },
          { value: 'open', label: 'مفتوحة', count: counts.open },
          { value: 'in_review', label: 'تحت المراجعة', count: counts.in_review },
          { value: 'closed', label: 'مغلقة', count: counts.closed },
        ]}
      />

      {loading && <Loading />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {!loading && !error && filtered.length === 0 && (
        <Card>
          <EmptyState icon={MessageSquareWarning} title="لا توجد شكاوى" subtitle="سجّل شكوى عند حدوث مشكلة مع عميل" />
        </Card>
      )}

      <div className="space-y-2.5">
        {filtered.map((complaint) => (
          <Card key={complaint.id} className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold text-slate-800">{complaint.type}</p>
                <Badge status={complaint.status} map={COMPLAINT_STATUS} />
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">{shortDate(complaint.created_at)}</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{complaint.description}</p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400">
                {complaint.customer_name}
                {complaint.booking_number ? ` • ${complaint.booking_number}` : ''}
              </p>
              <div className="flex gap-2">
                {complaint.status === 'open' && (
                  <Button size="sm" variant="secondary" onClick={() => setStatus(complaint, 'in_review')}>
                    بدء المراجعة
                  </Button>
                )}
                {complaint.status !== 'closed' && (
                  <Button size="sm" variant="outline" onClick={() => setStatus(complaint, 'closed')}>
                    إغلاق
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
