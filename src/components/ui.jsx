import { createContext, useContext, useEffect } from 'react';
import { Loader2, X } from 'lucide-react';

export const cn = (...parts) => parts.filter(Boolean).join(' ');

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl lg:text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('bg-white rounded-2xl border border-slate-100', className)} {...props}>
      {children}
    </div>
  );
}

const variants = {
  primary: 'bg-slate-900 text-white hover:bg-slate-800',
  secondary: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  outline: 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  danger: 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-5 py-3 text-sm rounded-xl',
};

export function Button({ variant = 'primary', size = 'md', className, children, loading, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      {label && <span className="block text-xs font-medium text-slate-600">{label}</span>}
      {children}
      {hint && <span className="block text-[11px] text-slate-400">{hint}</span>}
    </label>
  );
}

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition';

export function Input({ className, ...props }) {
  return <input className={cn(inputBase, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn(inputBase, 'min-h-[90px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn(inputBase, 'appearance-none', className)} {...props}>
      {children}
    </select>
  );
}

export function Badge({ status, map, className }) {
  const meta = map?.[status] || { label: status, color: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium whitespace-nowrap',
        meta.color,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', meta.dot || 'bg-slate-400')} />
      {meta.label}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, tone = 'bg-slate-50 text-slate-600' }) {
  return (
    <Card className="p-4">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', tone)}>
        {Icon && <Icon className="w-[18px] h-[18px]" />}
      </div>
      <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-400 mt-1.5">{label}</p>
    </Card>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-slate-300" />
        </div>
      )}
      <p className="text-slate-700 font-medium mb-1">{title}</p>
      {subtitle && <p className="text-sm text-slate-400 mb-4 max-w-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

export function Loading({ text = 'جاري التحميل...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <Loader2 className="w-8 h-8 animate-spin mb-3" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <p className="text-rose-600 font-medium mb-3">{message || 'حدث خطأ'}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-slate-600 underline">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function Tabs({ items, value, onChange, className }) {
  return (
    <div className={cn('flex gap-2 overflow-x-auto no-scrollbar', className)}>
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium border transition',
            value === item.value
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
          )}
        >
          {item.label}
          {item.count !== undefined && (
            <span className={cn('ms-1.5', value === item.value ? 'text-white/70' : 'text-slate-400')}>{item.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };
  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'relative w-full bg-white rounded-t-3xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto',
          widths[size],
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <p className="font-semibold text-slate-900">{title}</p>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-slate-100">{footer}</div>}
      </div>
    </div>
  );
}

export function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="flex items-center gap-2 text-sm text-slate-500">
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        {label}
      </span>
      <span className="text-sm font-medium text-slate-800 text-left">{value}</span>
    </div>
  );
}

export function Bar({ label, value, max, suffix }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-xs mb-1.5">
        <span className="text-slate-600">{label}</span>
        <span className="text-slate-800 font-medium">
          {value.toLocaleString('ar-SA')}
          {suffix || ''}
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-slate-800" style={{ width: `${Math.max(pct, 3)}%` }} />
      </div>
    </div>
  );
}

export const ToastContext = createContext(null);

export function ToastProvider({ toast, clear, children }) {
  return (
    <ToastContext.Provider value={{ toast, clear }}>
      {children}
      {toast && (
        <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-[90] flex justify-center px-4">
          <div
            className={cn(
              'rounded-xl px-4 py-2.5 text-sm shadow-lg text-white',
              toast.type === 'error' ? 'bg-rose-600' : 'bg-slate-900',
            )}
          >
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  return ctx || { toast: () => {}, clear: () => {} };
}
