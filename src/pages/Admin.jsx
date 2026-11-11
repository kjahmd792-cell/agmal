import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Trash2, ShieldCheck, Scissors, Package, Settings, UserPlus, Save } from 'lucide-react';
import { useAuth, useFetch } from '../context.jsx';
import { Button, Card, Field, Input, Loading, Modal, Select, Tabs, Textarea } from '../components/ui.jsx';
import { api } from '../api.js';
import { money } from '../lib.js';

const ROLE_LABELS = { admin: 'مدير', receptionist: 'موظف' };

export default function Admin({ initialTab = 'users' }) {
  const { user, branches, reload: reloadAuth } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || initialTab;

  const { data: users, reload: reloadUsers } = useFetch('/users');
  const { data: services, reload: reloadServices } = useFetch('/services');
  const { data: inventory, reload: reloadInventory } = useFetch('/inventory');
  const { data: settings, reload: reloadSettings } = useFetch('/settings');

  const [modal, setModal] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('receptionist');
  const [busy, setBusy] = useState(false);
  const [settingsForm, setSettingsForm] = useState(null);

  const currentSettings = settingsForm || settings || {};
  const setTab = (value) => setParams({ tab: value });

  const openService = (service) => {
    setEditing(service || null);
    setForm(
      service || {
        name: '',
        duration_minutes: 60,
        price: 200,
        category: '',
        description: '',
        active: true,
        branch_id: user.branch_id,
      },
    );
    setModal('service');
  };

  const openItem = (item) => {
    setEditing(item || null);
    setForm(
      item || {
        name: '',
        category: '',
        quantity: 0,
        unit: 'قطعة',
        low_stock: 5,
        cost: 0,
        branch_id: user.branch_id,
      },
    );
    setModal('inventory');
  };

  const saveService = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        duration_minutes: Number(form.duration_minutes) || 0,
        price: Number(form.price) || 0,
      };
      if (editing) await api.patch(`/services/${editing.id}`, payload);
      else await api.post('/services', payload);
      await reloadServices();
      setModal('');
    } finally {
      setBusy(false);
    }
  };

  const saveItem = async () => {
    setBusy(true);
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        low_stock: Number(form.low_stock) || 0,
        cost: Number(form.cost) || 0,
      };
      if (editing) await api.patch(`/inventory/${editing.id}`, payload);
      else await api.post('/inventory', payload);
      await reloadInventory();
      setModal('');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (collection, row, after) => {
    if (!window.confirm(`هل تريد حذف ${row.name}؟`)) return;
    await api.del(`/${collection}/${row.id}`);
    after();
  };

  const invite = async () => {
    if (!inviteEmail.includes('@')) return;
    setBusy(true);
    try {
      await api.post('/users', {
        full_name: inviteEmail.split('@')[0],
        email: inviteEmail.trim(),
        role: inviteRole,
        branch_id: user.branch_id,
      });
      setInviteEmail('');
      await reloadUsers();
    } finally {
      setBusy(false);
    }
  };

  const saveSettings = async () => {
    setBusy(true);
    try {
      await api.patch('/settings', {
        ...currentSettings,
        cancel_hours: Number(currentSettings.cancel_hours) || 0,
        cancel_fee_percent: Number(currentSettings.cancel_fee_percent) || 0,
      });
      await reloadSettings();
      setSettingsForm(null);
      reloadAuth?.();
    } finally {
      setBusy(false);
    }
  };

  const tabs = [
    { value: 'users', label: 'المستخدمون' },
    { value: 'services', label: 'الخدمات' },
    { value: 'inventory', label: 'المخزون' },
    { value: 'settings', label: 'الإعدادات' },
  ];

  const branchInventory = useMemo(
    () => (inventory || []).filter((item) => item.branch_id === user.branch_id),
    [inventory, user],
  );

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900">الإدارة</h1>
          <p className="text-sm text-slate-500 mt-1">المستخدمون والخدمات والمخزون وإعدادات المركز</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/more')}>
          رجوع
        </Button>
      </div>

      <Tabs className="mb-4" value={tab} onChange={setTab} items={tabs} />

      {tab === 'users' && (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <UserPlus className="w-4 h-4 text-slate-400" />
              <p className="text-sm font-semibold text-slate-800">دعوة مستخدم جديد</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                className="sm:col-span-2"
                placeholder="البريد الإلكتروني"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                dir="ltr"
              />
              <Select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                <option value="receptionist">موظف استقبال</option>
                <option value="admin">مدير النظام</option>
              </Select>
            </div>
            <Button className="mt-3" size="sm" loading={busy} onClick={invite}>
              إرسال الدعوة
            </Button>
          </Card>

          <div className="space-y-2">
            {(users || []).map((row) => (
              <Card key={row.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {row.full_name} {row.id === user.id && <span className="text-[11px] text-slate-400">(أنت)</span>}
                  </p>
                  <p className="text-xs text-slate-400 truncate" dir="ltr">
                    {row.email}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{row.branch_name}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    className="!py-1.5 text-xs"
                    value={row.role}
                    onChange={async (e) => {
                      await api.patch(`/users/${row.id}`, { role: e.target.value });
                      reloadUsers();
                    }}
                  >
                    <option value="receptionist">موظف</option>
                    <option value="admin">مدير</option>
                  </Select>
                  {row.id !== user.id && (
                    <button
                      onClick={() => remove('users', row, reloadUsers)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'services' && (
        <div className="space-y-3">
          <Button onClick={() => openService(null)}>
            <Plus className="w-4 h-4" />
            خدمة جديدة
          </Button>
          {!services && <Loading />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(services || []).map((service) => (
              <Card key={service.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{service.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {service.duration_minutes} دقيقة • {money(service.price)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 truncate">
                      {service.category} {service.description ? `• ${service.description}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => openService(service)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove('services', service, reloadServices)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-2">
                  <span
                    className={`text-[10px] rounded-full px-2 py-0.5 ${
                      service.active === false ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {service.active === false ? 'غير نشطة' : 'نشطة'}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'inventory' && (
        <div className="space-y-3">
          <Button onClick={() => openItem(null)}>
            <Plus className="w-4 h-4" />
            منتج جديد
          </Button>
          <div className="space-y-2">
            {branchInventory.map((item) => {
              const low = Number(item.quantity) <= Number(item.low_stock);
              return (
                <Card key={item.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{item.name}</p>
                      {Number(item.quantity) === 0 ? (
                        <span className="text-[10px] rounded-full bg-rose-100 text-rose-600 px-2 py-0.5">نفد المخزون</span>
                      ) : low ? (
                        <span className="text-[10px] rounded-full bg-amber-100 text-amber-700 px-2 py-0.5">مخزون منخفض</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.category || '—'} • {money(item.cost)} للوحدة
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-slate-800">
                      {item.quantity} {item.unit}
                    </span>
                    <button onClick={() => openItem(item)} className="p-2 rounded-lg text-slate-500 hover:bg-slate-50">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => remove('inventory', item, reloadInventory)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </Card>
              );
            })}
            {branchInventory.length === 0 && <p className="text-sm text-slate-400">لا توجد منتجات في المخزون</p>}
          </div>
        </div>
      )}

      {tab === 'settings' && (
        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-800">بيانات المركز</h2>
          </div>
          <Field label="اسم السبا">
            <Input
              value={currentSettings.spa_name || ''}
              onChange={(e) => setSettingsForm({ ...currentSettings, spa_name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="رقم الهاتف">
              <Input
                value={currentSettings.phone || ''}
                onChange={(e) => setSettingsForm({ ...currentSettings, phone: e.target.value })}
                dir="ltr"
              />
            </Field>
            <Field label="واتساب">
              <Input
                value={currentSettings.whatsapp || ''}
                onChange={(e) => setSettingsForm({ ...currentSettings, whatsapp: e.target.value })}
                dir="ltr"
              />
            </Field>
          </div>
          <Field label="العنوان">
            <Input
              value={currentSettings.address || ''}
              onChange={(e) => setSettingsForm({ ...currentSettings, address: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="وقت الافتتاح">
              <Input
                type="time"
                value={currentSettings.open_time || '10:00'}
                onChange={(e) => setSettingsForm({ ...currentSettings, open_time: e.target.value })}
              />
            </Field>
            <Field label="وقت الإغلاق">
              <Input
                type="time"
                value={currentSettings.close_time || '22:00'}
                onChange={(e) => setSettingsForm({ ...currentSettings, close_time: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="السماح بالإلغاء قبل (ساعة)">
              <Input
                type="number"
                value={currentSettings.cancel_hours ?? 6}
                onChange={(e) => setSettingsForm({ ...currentSettings, cancel_hours: e.target.value })}
              />
            </Field>
            <Field label="رسوم الإلغاء (%)">
              <Input
                type="number"
                value={currentSettings.cancel_fee_percent ?? 25}
                onChange={(e) => setSettingsForm({ ...currentSettings, cancel_fee_percent: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="الفرع">
              <Select disabled value={user.branch_id}>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button loading={busy} onClick={saveSettings}>
            <Save className="w-4 h-4" />
            حفظ الإعدادات
          </Button>
        </Card>
      )}

      <Modal
        open={modal === 'service'}
        onClose={() => setModal('')}
        title={editing ? 'تعديل خدمة' : 'خدمة جديدة'}
        footer={
          <Button className="w-full" loading={busy} onClick={saveService}>
            {editing ? 'حفظ التعديلات' : 'إضافة الخدمة'}
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="اسم الخدمة">
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="المدة (دقيقة)">
              <Input
                type="number"
                value={form.duration_minutes ?? ''}
                onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
              />
            </Field>
            <Field label="السعر (ر.س)">
              <Input type="number" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </Field>
          </div>
          <Field label="التصنيف (اختياري)">
            <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="وصف الخدمة (اختياري)">
            <Textarea
              value={form.description || ''}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </Field>
          <Field label="الحالة">
            <Select
              value={form.active === false ? 'false' : 'true'}
              onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })}
            >
              <option value="true">نشطة</option>
              <option value="false">غير نشطة</option>
            </Select>
          </Field>
        </div>
      </Modal>

      <Modal
        open={modal === 'inventory'}
        onClose={() => setModal('')}
        title={editing ? 'تعديل منتج' : 'منتج جديد'}
        footer={
          <Button className="w-full" loading={busy} onClick={saveItem}>
            {editing ? 'حفظ التعديلات' : 'إضافة المنتج'}
          </Button>
        }
      >
        <div className="space-y-3">
          <Field label="اسم المنتج">
            <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: زيت تدليك عطري" />
          </Field>
          <Field label="التصنيف">
            <Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="زيوت، مناشف..." />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="الكمية">
              <Input type="number" value={form.quantity ?? ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </Field>
            <Field label="الوحدة">
              <Select value={form.unit || 'قطعة'} onChange={(e) => setForm({ ...form, unit: e.target.value })}>
                {['قطعة', 'لتر', 'مل', 'جرام', 'كجم', 'علبة', 'زجاجة', 'عبوة'].map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="حد التنبيه">
              <Input type="number" value={form.low_stock ?? ''} onChange={(e) => setForm({ ...form, low_stock: e.target.value })} />
            </Field>
            <Field label="التكلفة للوحدة">
              <Input type="number" value={form.cost ?? ''} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </Field>
          </div>
        </div>
      </Modal>
    </div>
  );
}
