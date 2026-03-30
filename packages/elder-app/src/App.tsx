import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Landing Pages (Public)
import WelcomeSplashPage from "@/pages/WelcomeSplashPage";
import LandingPage from "@/pages/LandingPage";

// Auth Pages
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";
import ProfileSetupPage from "@/pages/auth/ProfileSetupPage";

// Protected Pages
import { HomePage } from "@/pages/HomePage";
import ChatPage from "@/pages/ChatPage";
import ElderProfilePage from "@/pages/elder/ProfilePage";

// Family Pages
import { DashboardLayout } from "@/layout/family/DashboardLayout";
import { DashboardPage } from "@/pages/family/DashboardPage";
import { ActivityPage } from "@/pages/family/ActivityPage";
import { AlertsPage } from "@/pages/family/AlertsPage";
import { ElderProfileView } from "@/pages/family/ElderProfileView";
import { MyProfilePage } from "@/pages/family/MyProfilePage";
import { ConnectElderPage } from "@/pages/family/ConnectElderPage";
import { SettingsPage } from "@/pages/family/SettingsPage";

import { ProtectedRoute, processGoogleRedirectResult } from "@elder-nest/shared";

const queryClient = new QueryClient();

// Component to handle Google redirect result after page reload
function GoogleRedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    processGoogleRedirectResult().then((user) => {
      if (user) {
        const role = sessionStorage.getItem('google_signin_role') || 'elder';
        console.log('✅ Google redirect completed, navigating...', role);
        if (role === 'family') {
          navigate('/family');
        } else {
          navigate('/dashboard');
        }
      }
    });
  }, [navigate]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <GoogleRedirectHandler />
        <div className="min-h-screen bg-[#F8F9FA] text-[#2C3E50] font-sans">
          <Routes>
            {/* Public Landing Pages - First Impression */}
            <Route path="/" element={<WelcomeSplashPage />} />
            <Route path="/home" element={<LandingPage />} />

            {/* Auth Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />

            {/* Profile Setup - Protected (Elder only) */}
            <Route path="/auth/profile-setup" element={
              <ProtectedRoute allowedRoles={['elder']} requireSetup={false}>
                <ProfileSetupPage />
              </ProtectedRoute>
            } />

            {/* Protected Routes - Dashboard */}
            <Route path="/dashboard" element={
              <ProtectedRoute allowedRoles={['elder']}>
                <HomePage />
              </ProtectedRoute>
            } />

            <Route path="/chat" element={
              <ProtectedRoute allowedRoles={['elder']}>
                <ChatPage />
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute allowedRoles={['elder']}>
                <ElderProfilePage />
              </ProtectedRoute>
            } />

            {/* Family Portal Routes */}
            <Route path="/family" element={
              <ProtectedRoute allowedRoles={['family']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<DashboardPage />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="alerts" element={<AlertsPage />} />
              <Route path="profile" element={<ElderProfileView />} />
              <Route path="my-profile" element={<MyProfilePage />} />
              <Route path="connect" element={<ConnectElderPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
