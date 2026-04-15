import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
// import { ProtectedRoute } from './components/auth/ProtectedRoute';

import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/home/HomePage';
import { SearchPage } from './pages/search/SearchPage';
import { PlaylistPage } from './pages/playlist/PlaylistPage';
import { ArtistPage } from './pages/artist/ArtistPage';
import { TrackPage } from './pages/track/TrackPage';
import { LibraryPage } from './pages/library/LibraryPage';
import { AlbumPage } from './pages/album/AlbumPage';
import { ArtistDashboardLayout } from './pages/artist-dashboard/ArtistDashboardLayout';
import { ArtistAnalyticsPage } from './pages/artist-dashboard/ArtistAnalyticsPage';
import { ArtistSongsPage } from './pages/artist-dashboard/ArtistSongsPage';
import { ArtistAlbumsPage } from './pages/artist-dashboard/ArtistAlbumsPage';
import { ArtistSettingsPage } from './pages/artist-dashboard/ArtistSettingsPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminOverviewPage } from './pages/admin/AdminOverviewPage';
import { AdminPendingSongsPage } from './pages/admin/AdminPendingSongsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { AccountSettingsPage } from './pages/settings/AccountSettingsPage';
import { SectionPage } from './pages/section/SectionPage';
import { useLibraryStore } from './stores/library.store';
import { useAuthStore } from './stores/auth.store';
import { useEffect, useState } from 'react';
import axios from 'axios';

// Màn hình full không có Sidebar (cho Login/Register)

// Màn hình full không có Sidebar (cho Login/Register)
function App() {
  const { isAuthenticated, accessToken, setTokens, logout } = useAuthStore();
  const { hydrate, isHydrated } = useLibraryStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      if (isAuthenticated && !accessToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          if (res.data?.success) {
            setTokens(res.data.data.accessToken);
          }
        } catch (err) {
          logout();
        }
      }
      setIsCheckingAuth(false);
    };
    initAuth();
  }, [isAuthenticated, accessToken, setTokens, logout]);

  useEffect(() => {
    if (isAuthenticated && accessToken && !isHydrated) {
      hydrate();
    }
  }, [isAuthenticated, accessToken, isHydrated, hydrate]);

  if (isCheckingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#121212] text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1ed760] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (No Sidebar/Player) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Protected routes wrapped in MainLayout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/playlist/:id" element={<PlaylistPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/artist/:id" element={<ArtistPage />} />
          <Route path="/track/:id" element={<TrackPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/settings" element={<AccountSettingsPage />} />
          <Route path="/section/:id" element={<SectionPage />} />
          <Route path="/song/:id" element={<Navigate to="/track/:id" replace />} />
        </Route>

        {/* Artist Dashboard (full screen, no MainLayout) */}
        <Route path="/artist-dashboard" element={<ProtectedRoute roles={['ARTIST', 'ADMIN']}><ArtistDashboardLayout /></ProtectedRoute>}>
          <Route index element={<ArtistAnalyticsPage />} />
          <Route path="songs" element={<ArtistSongsPage />} />
          <Route path="albums" element={<ArtistAlbumsPage />} />
          <Route path="settings" element={<ArtistSettingsPage />} />
        </Route>

        {/* Admin Dashboard */}
        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN', 'MODERATOR']}><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="songs" element={<AdminPendingSongsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
          <Route path="audit" element={<AdminAuditLogsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
