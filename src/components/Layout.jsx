import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  CalendarDays,
  Gift,
  Menu as MenuIcon,
  Sparkles,
  LogOut,
  User,
  TriangleAlert,
  Building2,
} from 'lucide-react';
import { useAuth } from '../context.jsx';
import { cn, ToastProvider } from './ui.jsx';

const navItems = [
  { to: '/', label: 'الرئيسية', icon: Home, end: true },
  { to: '/bookings', label: 'الحجوزات', icon: CalendarDays },
  { to: '/gifts', label: 'الهدايا', icon: Gift },
  { to: '/more', label: 'المزيد', icon: MenuIcon },
];

export default function Layout() {
  const { user, branches, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);

  const branch = branches.find((b) => b.id === user?.branch_id);
  const title = navItems.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label;

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = (message, type = 'success') => setToast({ message, type });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <ToastProvider toast={toast} clear={() => setToast(null)}>
      <div dir="rtl" className="min-h-screen bg-slate-50 flex">
        {/* Sidebar — desktop */}
        <aside className="hidden lg:flex w-64 flex-col bg-white border-l border-slate-200 fixed inset-y-0 right-0 z-30">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-sm leading-tight">نظام الاستقبال</p>
                <p className="text-[11px] text-slate-400">مركز السبا</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.5 : 2} />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <div className="px-3 py-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">{user?.full_name || user?.email}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {branch?.name || '—'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              تسجيل الخروج
            </button>
          </div>
        </aside>

        <div className="flex-1 lg:mr-64 flex flex-col min-h-screen">
          <div className="flex items-center justify-between gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-800">
            <span className="flex items-center gap-1.5">
              <TriangleAlert className="w-3.5 h-3.5" />
              وضع تجريبي — البيانات معروضة للتجربة
            </span>
            <button onClick={handleLogout} className="underline font-medium">
              إنهاء
            </button>
          </div>

          {/* Header — mobile */}
          <header className="lg:hidden sticky top-0 z-30 bg-white/90 backdrop-blur-lg border-b border-slate-200">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 leading-tight">{title || 'نظام الاستقبال'}</p>
                  <p className="text-[10px] text-slate-400">{branch?.name || 'مركز السبا'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
              >
                <User className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </header>

          <main className="flex-1 pb-24 lg:pb-8">
            <Outlet context={{ showToast, branch }} />
          </main>

          {/* Bottom nav — mobile */}
          <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/90 backdrop-blur-lg border-t border-slate-200 lg:hidden">
            <div className="flex items-stretch justify-around max-w-2xl mx-auto">
              {navItems.map((item) => {
                const active = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 py-2.5 px-4 flex-1 transition-colors',
                      active ? 'text-slate-900' : 'text-slate-400',
                    )}
                  >
                    <div className={cn('relative', active && 'scale-110 transition-transform')}>
                      <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 2} />
                      {active && (
                        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-900" />
                      )}
                    </div>
                    <span className={cn('text-[11px] font-medium', active && 'font-semibold')}>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </ToastProvider>
  );
}
