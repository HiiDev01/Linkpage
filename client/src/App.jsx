import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './components/DashboardLayout.jsx';
import Landing from './pages/Landing.jsx';
import { Login, Register, Forgot, ResetPassword } from './pages/AuthPages.jsx';
import Dashboard from './pages/Dashboard.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import ProfileEditor from './pages/ProfileEditor.jsx';
import LinksPage from './pages/LinksPage.jsx';
import PortfolioPage from './pages/PortfolioPage.jsx';
import ThemeEditor from './pages/ThemeEditor.jsx';
import NotFound from './pages/NotFound.jsx';
import PublicProfile from './pages/PublicProfile.jsx';

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />
      <Route path="/forgot-password" element={<Forgot />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="profile" element={<ProfileEditor />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="portfolio" element={<PortfolioPage />} />
        <Route path="appearance" element={<ThemeEditor />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Route>

      {/* Static routes above outrank this; reserved usernames keep them from colliding. */}
      <Route path="/:username" element={<PublicProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
