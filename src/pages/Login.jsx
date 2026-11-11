import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Sparkles, LogIn, Mail, Lock, Loader2, PlayCircle } from 'lucide-react';
import { useAuth } from '../context.jsx';

export default function Login() {
  const { loginDemo, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const enter = async (action) => {
    setError('');
    setBusy(action);
    try {
      if (action === 'demo') await loginDemo();
      else await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setBusy('');
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-900 mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">مرحبًا بعودتك</h1>
          <p className="text-slate-500 mt-2 text-sm">سجّل الدخول إلى حسابك</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-7">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => enter('demo')}
              disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {busy === 'demo' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-5 h-5" />}
              دخول تجريبي بضغطة واحدة
            </button>
            <p className="text-[11px] text-slate-400 text-center mt-2 leading-relaxed">
              أو أدخل أي بريد وكلمة مرور، وسيتم الدخول في الوضع التجريبي مباشرة
            </p>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">أو بحسابك</span>
            </div>
          </div>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              enter('form');
            }}
          >
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-medium text-slate-600">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-medium text-slate-600">
                  كلمة المرور
                </label>
                <span className="text-[11px] text-slate-400">أي كلمة مرور تعمل في الوضع التجريبي</span>
              </div>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
                  required
                />
              </div>
            </div>

            {error && <p className="text-xs text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={!!busy}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white py-3 text-sm font-medium hover:bg-slate-800 transition-colors disabled:opacity-60"
            >
              {busy === 'form' ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              {busy === 'form' ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          تريد حسابًا جديدًا؟{' '}
          <Link to="/login" className="text-slate-900 font-medium hover:underline">
            استخدم الدخول التجريبي
          </Link>
        </p>
      </div>
    </div>
  );
}
