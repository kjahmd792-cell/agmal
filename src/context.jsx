import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [branches, setBranches] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await api.get('/bootstrap');
      setUser(data.user);
      setBranches(data.branches);
      setSettings(data.settings);
      setError('');
    } catch (err) {
      if (err.status !== 401) setError(err.message);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const loginDemo = useCallback(async () => {
    const data = await api.post('/auth/demo');
    setUser(data.user);
    await load();
    return data.user;
  }, [load]);

  const login = useCallback(
    async (email, password) => {
      const data = await api.post('/auth/login', { email, password });
      setUser(data.user);
      await load();
      return data.user;
    },
    [load],
  );

  const register = useCallback(
    async (payload) => {
      const data = await api.post('/auth/register', payload);
      setUser(data.user);
      await load();
      return data.user;
    },
    [load],
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      /* ignore */
    }
    setUser(null);
  }, []);

  const updateUser = useCallback(async (patch) => {
    const data = await api.patch('/auth/me', patch);
    setUser(data.user);
    return data.user;
  }, []);

  const setBranch = useCallback(
    async (branchId) => {
      await updateUser({ branch_id: branchId });
    },
    [updateUser],
  );

  const value = useMemo(
    () => ({
      user,
      branches,
      settings,
      loading,
      error,
      login,
      loginDemo,
      register,
      logout,
      updateUser,
      setBranch,
      reload: load,
      setSettings,
    }),
    [user, branches, settings, loading, error, login, loginDemo, register, logout, updateUser, setBranch, load],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function useFetch(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!path) return;
    try {
      const result = await api.get(path);
      setData(result);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    setLoading(true);
    reload();
  }, [reload]);

  return { data, loading, error, reload, setData };
}
