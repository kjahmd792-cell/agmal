import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ArrowRight, Save, BellRing } from 'lucide-react';
import { useAuth } from '../context.jsx';
import { Button, Card, Field, Input, Select, cn } from '../components/ui.jsx';

export default function Profile() {
  const { user, branches, updateUser } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useOutletContext() || {};
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [branchId, setBranchId] = useState(user?.branch_id || '');
  const [notifications, setNotifications] = useState({
    notify_bookings: user?.notify_bookings !== false,
    notify_late: user?.notify_late !== false,
    notify_payments: user?.notify_payments !== false,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      const patch = { full_name: fullName, branch_id: branchId, ...notifications };
      await updateUser(patch);
      showToast?.('تم الحفظ');
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const toggles = [
    { key: 'notify_bookings', label: 'تنبيهات الحجوزات الجديدة' },
    { key: 'notify_late', label: 'تنبيهات تأخر العملاء' },
    { key: 'notify_payments', label: 'إشعارات المدفوعات' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-8 py-6">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-slate-500 mb-4 hover:text-slate-700">
        <ArrowRight className="w-4 h-4" />
        رجوع
      </button>

      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-900">الملف الشخصي</h1>
        <p className="text-sm text-slate-500 mt-1">المعلومات الشخصية والتفضيلات</p>
      </div>

      <Card className="p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-bold text-xl">
          {(user?.full_name || '؟').charAt(0)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{user?.full_name}</p>
          <p className="text-xs text-slate-400" dir="ltr">
            {user?.email}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {user?.role === 'admin' ? 'مدير النظام' : 'موظف استقبال'}
          </p>
        </div>
      </Card>

      <Card className="p-5 space-y-3 mb-4">
        <h2 className="text-sm font-semibold text-slate-800">المعلومات الشخصية</h2>
        <Field label="الاسم الكامل">
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="الفرع الحالي">
          <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Card className="p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <BellRing className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-800">التفضيلات</h2>
        </div>
        <div className="space-y-2">
          {toggles.map((toggle) => (
            <button
              key={toggle.key}
              onClick={() => setNotifications((prev) => ({ ...prev, [toggle.key]: !prev[toggle.key] }))}
              className="w-full flex items-center justify-between rounded-xl border border-slate-100 px-3 py-3 text-right hover:bg-slate-50"
            >
              <span className="text-sm text-slate-700">{toggle.label}</span>
              <span
                className={cn(
                  'w-10 h-5 rounded-full p-0.5 transition-colors',
                  notifications[toggle.key] ? 'bg-slate-900' : 'bg-slate-200',
                )}
              >
                <span
                  className={cn(
                    'block w-4 h-4 rounded-full bg-white transition-transform',
                    notifications[toggle.key] ? '-translate-x-5' : 'translate-x-0',
                  )}
                />
              </span>
            </button>
          ))}
        </div>
      </Card>

      <Button size="lg" className="w-full" loading={busy} onClick={save}>
        <Save className="w-4 h-4" />
        حفظ
      </Button>
    </div>
  );
}
