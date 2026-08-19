import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';
import AdminBarbers from './pages/admin/AdminBarbers';
import AdminSettings from './pages/admin/AdminSettings';
import AdminServices from './pages/admin/AdminServices';

// Public & Barber Imports
import PublicLayout from './layouts/PublicLayout';
import BarberDirectory from './pages/public/BarberDirectory';
import BarberProfile from './pages/public/BarberProfile';
import BarberLayout from './layouts/BarberLayout';
import BarberDashboard from './pages/barber/BarberDashboard';
import BarberWorkingHours from './pages/barber/BarberWorkingHours';
import BarberSettings from './pages/barber/BarberSettings';

// Customer Imports
import CustomerLayout from './layouts/CustomerLayout';
import MyBookings from './pages/customer/MyBookings';
import BookingWizard from './pages/public/BookingWizard';

// Public Imports
import Home from './pages/public/Home';
import About from './pages/public/About';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleProtectedRoute({ children, requiredRole }: { children: React.ReactNode, requiredRole: string }) {
  const { isAuthenticated, userRole } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  // If requiredRole is defined but user doesn't have it (case-insensitive check)
  if (requiredRole && (!userRole || userRole.toLowerCase() !== requiredRole.toLowerCase())) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
}

// Redirect based on role instead of placeholder
function DashboardRouter() {
  const { userRole } = useAuth();
  
  if (userRole?.toLowerCase() === 'admin') return <Navigate to="/admin" replace />;
  if (userRole?.toLowerCase() === 'barber') return <Navigate to="/barber" replace />;
  
  // Default for customer
  return <Navigate to="/bookings" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth"  element={<AuthPage />} />
      <Route path="/callback" element={<AuthCallbackPage />} />
      <Route path="/dashboard" element={<DashboardRouter />} />

      {/* Authenticated Customer Routes */}
      <Route 
        path="/bookings" 
        element={
          <ProtectedRoute>
            <CustomerLayout />
          </ProtectedRoute>
        } 
      >
        <Route index element={<MyBookings />} />
        {/* We can add /bookings/:id here if we make a detail view later */}
      </Route>
      
      {/* Public Routes with Public Layout */}
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/barbers" element={<BarberDirectory />} />
        <Route path="/barbers/:id" element={<BarberProfile />} />
        <Route path="/barbers/:id/book" element={<BookingWizard />} />
      </Route>

      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <RoleProtectedRoute requiredRole="Admin">
            <AdminLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="bookings" element={<AdminBookings />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="barbers" element={<AdminBarbers />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* Barber Portal Routes */}
      <Route 
        path="/barber" 
        element={
          <RoleProtectedRoute requiredRole="Barber">
            <BarberLayout />
          </RoleProtectedRoute>
        }
      >
        <Route index element={<BarberDashboard />} />
        <Route path="working-hours" element={<BarberWorkingHours />} />
        <Route path="settings" element={<BarberSettings />} />
      </Route>

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
