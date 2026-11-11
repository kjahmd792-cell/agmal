import { Navigate, Route, Routes } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './context.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Bookings from './pages/Bookings.jsx';
import BookingNew from './pages/BookingNew.jsx';
import BookingDetail from './pages/BookingDetail.jsx';
import WalkIn from './pages/WalkIn.jsx';
import Gifts from './pages/Gifts.jsx';
import GiftNew from './pages/GiftNew.jsx';
import GiftDetail from './pages/GiftDetail.jsx';
import More from './pages/More.jsx';
import Customers from './pages/Customers.jsx';
import CustomerDetail from './pages/CustomerDetail.jsx';
import Therapists from './pages/Therapists.jsx';
import Rooms from './pages/Rooms.jsx';
import Payments from './pages/Payments.jsx';
import Complaints from './pages/Complaints.jsx';
import ComplaintNew from './pages/ComplaintNew.jsx';
import WaitlistNew from './pages/WaitlistNew.jsx';
import Profile from './pages/Profile.jsx';
import Reports from './pages/Reports.jsx';
import CalendarPage from './pages/CalendarPage.jsx';
import Admin from './pages/Admin.jsx';

function FullScreenLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50">
      <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/bookings/new" element={<BookingNew />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/walk-in" element={<WalkIn />} />
        <Route path="/gifts" element={<Gifts />} />
        <Route path="/gifts/new" element={<GiftNew />} />
        <Route path="/gifts/:id" element={<GiftDetail />} />
        <Route path="/more" element={<More />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/therapists" element={<Therapists />} />
        <Route path="/rooms" element={<Rooms />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/complaints" element={<Complaints />} />
        <Route path="/complaints/new" element={<ComplaintNew />} />
        <Route path="/waitlist/new" element={<WaitlistNew />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/system-settings" element={<Admin initialTab="settings" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
