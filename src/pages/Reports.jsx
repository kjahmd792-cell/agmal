import { useState } from 'react';
import { Banknote, CalendarDays, CheckCircle2, Ban, TrendingUp } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Bar, Button, Card, ErrorBox, Field, Input, Loading, StatCard } from '../components/ui.jsx';
import { money, shortDate, today, addDays } from '../lib.js';

export default function Reports() {
  const { user } = useAuth();
  const [from, setFrom] = useState(addDays(-6));
  const [to, setTo] = useState(today());

  const { data, loading, error, reload } = useFetch(
    `/reports?branch_id=${user?.branch_id || ''}&from=${from}&to=${to}`,
  );

  const presets = [
    { label: 'هذا الأسبوع', from: addDays(-6), to: today() },
    { label: 'هذا الشهر', from: addDays(-29), to: today() },
    { label: 'آخر ٩٠ يومًا', from: addDays(-89), to: today() },
  ];

  const maxTherapist = data?.byTherapist?.[0]?.value || 0;
  const maxService = data?.byService?.[0]?.value || 0;
  const maxDay = Math.max(...(data?.byDay || []).map((d) => d.value), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5">
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">التقارير</h1>
        <p className="text-sm text-slate-500 mt-1">المبيعات والإحصائيات</p>
      </div>

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap gap-2 mb-3">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              size="sm"
              variant={from === preset.from && to === preset.to ? 'primary' : 'outline'}
              onClick={() => {
                setFrom(preset.from);
                setTo(preset.to);
              }}
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="من تاريخ">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="إلى تاريخ">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
        </div>
      </Card>

      {loading && <Loading text="جاري تحميل التقارير..." />}
      {error && <ErrorBox message={error} onRetry={reload} />}

      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <StatCard icon={Banknote} label="إجمالي المبيعات" value={money(data.totals.revenue)} tone="bg-teal-50 text-teal-600" />
            <StatCard icon={CalendarDays} label="إجمالي الحجوزات" value={data.totals.bookings} tone="bg-blue-50 text-blue-600" />
            <StatCard icon={CheckCircle2} label="حجوزات مدفوعة" value={data.totals.paid} tone="bg-emerald-50 text-emerald-600" />
            <StatCard icon={Ban} label="ملغاة / لم يحضر" value={data.totals.cancelled} tone="bg-rose-50 text-rose-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-800">المبيعات حسب المختص</h2>
              </div>
              {data.byTherapist.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد مبيعات مسجلة في هذه الفترة</p>
              ) : (
                data.byTherapist.map((row) => (
                  <Bar key={row.name} label={row.name} value={row.value} max={maxTherapist} suffix=" ر.س" />
                ))
              )}
            </Card>

            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-800 mb-3">أكثر الخدمات طلبًا</h2>
              {data.byService.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">لا توجد خدمات محجوزة في هذه الفترة</p>
              ) : (
                data.byService.map((row) => (
                  <Bar key={row.name} label={row.name} value={row.value} max={maxService} suffix=" حجز" />
                ))
              )}
            </Card>
          </div>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-800 mb-3">المبيعات اليومية</h2>
            {data.byDay.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">لا توجد بيانات كافية</p>
            ) : (
              <div className="flex items-end justify-between gap-1.5 h-40">
                {data.byDay.map((day) => (
                  <div key={day.date} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                    <span className="text-[9px] text-slate-500">{Math.round(day.value)}</span>
                    <div
                      className="w-full rounded-t-md bg-slate-800 min-h-[3px]"
                      style={{ height: `${Math.max(4, (day.value / (maxDay || 1)) * 100)}%` }}
                    />
                    <span className="text-[9px] text-slate-400 whitespace-nowrap">{shortDate(day.date).slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
