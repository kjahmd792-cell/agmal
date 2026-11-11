import { useNavigate } from 'react-router-dom';
import {
  UserRound,
  DoorOpen,
  CreditCard,
  Users,
  MessageSquareWarning,
  BarChart3,
  CalendarRange,
  User,
  LogOut,
  ChevronLeft,
  Settings,
  Package,
  Scissors,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context.jsx';
import { Card, cn } from '../components/ui.jsx';

const items = [
  { label: 'المختصون', desc: 'حالة المختصين والحجوزات', icon: UserRound, to: '/therapists', color: 'bg-amber-50 text-amber-600' },
  { label: 'الغرف', desc: 'حالة الغرف', icon: DoorOpen, to: '/rooms', color: 'bg-violet-50 text-violet-600' },
  { label: 'المدفوعات', desc: 'العمليات المالية', icon: CreditCard, to: '/payments', color: 'bg-teal-50 text-teal-600' },
  { label: 'العملاء', desc: 'قاعدة العملاء', icon: Users, to: '/customers', color: 'bg-emerald-50 text-emerald-600' },
  { label: 'المشكلات والشكاوى', desc: 'متابعة المشكلات', icon: MessageSquareWarning, to: '/complaints', color: 'bg-rose-50 text-rose-600' },
  { label: 'التقارير', desc: 'المبيعات والإحصائيات', icon: BarChart3, to: '/reports', color: 'bg-blue-50 text-blue-600' },
  { label: 'التقويم', desc: 'جدول الحجوزات الأسبوعي', icon: CalendarRange, to: '/calendar', color: 'bg-indigo-50 text-indigo-600' },
];

const adminItems = [
  { label: 'الخدمات', desc: 'إدارة قائمة الخدمات', icon: Scissors, tab: 'services' },
  { label: 'المخزون', desc: 'منتجات ومستهلكات', icon: Package, tab: 'inventory' },
  { label: 'المستخدمون', desc: 'أدوار وصلاحيات', icon: ShieldCheck, tab: 'users' },
  { label: 'إعدادات المركز', desc: 'بيانات وسياسات', icon: Settings, tab: 'settings' },
];

export default function More() {
  const { user, branches, logout } = useAuth();
  const navigate = useNavigate();
  const branch = branches.find((b) => b.id === user?.branch_id);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-5">المزيد</h1>

      <div className="space-y-2.5 mb-6">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center', item.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-slate-300" />
            </button>
          );
        })}
      </div>

      <h2 className="text-sm font-semibold text-slate-700 mb-3">الإدارة</h2>
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {adminItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => navigate(`/admin?tab=${item.tab}`)}
              className="bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-2.5">
                <Icon className="w-4 h-4 text-slate-600" />
              </div>
              <p className="font-semibold text-slate-800 text-sm">{item.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate('/profile')}
        className="w-full flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 text-right hover:border-slate-300 hover:shadow-sm transition-all mb-4"
      >
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center text-white font-bold text-lg">
          {(user?.full_name || '؟').charAt(0)}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-800 text-sm">{user?.full_name || user?.email}</p>
          <p className="text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            {branch?.name} · الملف الشخصي
          </p>
        </div>
        <ChevronLeft className="w-4 h-4 text-slate-300" />
      </button>

      <button
        onClick={async () => {
          await logout();
          navigate('/login');
        }}
        className="w-full flex items-center justify-center gap-2 bg-white border border-rose-200 text-rose-600 py-3.5 rounded-xl font-medium hover:bg-rose-50 transition"
      >
        <LogOut className="w-4 h-4" />
        تسجيل الخروج
      </button>
    </div>
  );
}
