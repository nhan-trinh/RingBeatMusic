import React from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';

interface ProtectedRouteProps {
  children: React.ReactElement;
  roles?: string[];
}

export const ProtectedRoute = ({ children, roles }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    // Chuyển hướng người dùng vào login, đính kèm thông tin để quay lại trang đích
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Khúc này dành cho việc chặn trang của Role (VD: chỉ Admin vào được /admin, Moderator vào /moderation)
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />; // Đẩy ra trang chủ nếu cấm
  }

  return children;
};
